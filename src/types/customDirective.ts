import { BinderConfig } from "../core/binder/Binder";

type customDirective = {
  [key: string]: {
    /** Allow to remove the directive after the bind */
    removable?: boolean,
    bind?: (node: Node, bindConfig: BinderConfig) => boolean | undefined,
    update?: (node: Node, bindConfig: BinderConfig) => void
  }
};

export default customDirective;
