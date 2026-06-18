// Makes `props.theme` (and the `theme` arg in template literals) fully typed
// against our AppTheme. styled-components v6 ships its own types, so we only
// augment DefaultTheme here — no @types/styled-components needed.

import "styled-components";
import type { AppTheme } from "./theme";

declare module "styled-components" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface DefaultTheme extends AppTheme {}
}
