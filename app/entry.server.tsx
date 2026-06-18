import { PassThrough, Transform } from "node:stream";

import type { AppLoadContext, EntryContext } from "react-router";
import { createReadableStreamFromReadable } from "@react-router/node";
import { ServerRouter } from "react-router";
import { renderToPipeableStream } from "react-dom/server";
import { ServerStyleSheet } from "styled-components";

export const streamTimeout = 5_000;

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  _loadContext: AppLoadContext,
) {
  // https://httpwg.org/specs/rfc9110.html#HEAD
  if (request.method.toUpperCase() === "HEAD") {
    return new Response(null, {
      status: responseStatusCode,
      headers: responseHeaders,
    });
  }

  return new Promise((resolve, reject) => {
    let shellRendered = false;

    // styled-components collects every rule rendered through `collectStyles`.
    // We must read the sheet only after the full tree has rendered, so we use
    // `onAllReady` (not `onShellReady`) and inject the tags before </head>.
    const sheet = new ServerStyleSheet();

    let timeoutId: ReturnType<typeof setTimeout> | undefined = setTimeout(
      () => abort(),
      streamTimeout + 1000,
    );

    const { pipe, abort } = renderToPipeableStream(
      sheet.collectStyles(
        <ServerRouter context={routerContext} url={request.url} />,
      ),
      {
        onAllReady() {
          shellRendered = true;

          let styleTags = "";
          try {
            styleTags = sheet.getStyleTags();
          } catch (error) {
            console.error("Failed to collect styled-components styles", error);
          } finally {
            sheet.seal();
          }

          const body = new PassThrough({
            final(callback) {
              clearTimeout(timeoutId);
              timeoutId = undefined;
              callback();
            },
          });

          // Inject the collected <style> tags right before </head>. The <head>
          // is emitted in the first chunk, so we only need to scan until the
          // injection happens, then pass chunks straight through.
          let injected = false;
          const injector = new Transform({
            transform(chunk, _encoding, callback) {
              if (injected) {
                this.push(chunk);
                return callback();
              }
              const str = chunk.toString("utf8");
              const idx = str.indexOf("</head>");
              if (idx === -1) {
                this.push(chunk);
                return callback();
              }
              injected = true;
              this.push(str.slice(0, idx) + styleTags + str.slice(idx));
              callback();
            },
          });

          const stream = createReadableStreamFromReadable(body);

          responseHeaders.set("Content-Type", "text/html");

          injector.pipe(body);
          pipe(injector);

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            }),
          );
        },
        onShellError(error: unknown) {
          reject(error);
        },
        onError(error: unknown) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        },
      },
    );
  });
}
