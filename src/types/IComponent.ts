import Component from "../core/component/Component";
import BouerEvent from "../core/event/BouerEvent";

export default interface IComponent {
  /** The name of the component */
  name: string

  /** The path of the component (required) */
  path: string;

  /** The title that will be replaced when the page is loaded */
  title?: string;

  /** The navigation url */
  route?: string;

  /** The component html template [hard code component] */
  template?: string;

  /** The default data that will be injected in the component */
  data?: object;

  /** Allow the component the keep the last state */
  keepAlive?: boolean;

  /** The children of the component that will inherit the `route` of the father */
  children?: Array<IComponent>;

  /** restrictions of this component */
  restrictions?: Array<(compoment: Component) => boolean>;

  /** The hook that will be called when the component is requested */
  requested?: (event: BouerEvent) => void;

  /** The hook that will be called when the component is created */
  created?: (event: BouerEvent) => void;

  /** The hook that will be called before the component is mounted */
  beforeMount?: (event: BouerEvent) => void;

  /** The hook that will be called after the component is mounted */
  mounted?: (event: BouerEvent) => void;

  /** The hook that will be called before the component is loaded */
  beforeLoad?: (event: BouerEvent) => void;

  /** The hook that will be called after the component is loaded (Compiled) */
  loaded?: (event: BouerEvent) => void;

  /** The hook that will be called before the component is destroyed */
  beforeDestroy?: (event: BouerEvent) => void;

  /** The hook that will be called after the component is destroyed */
  destroyed?: (event: BouerEvent) => void;

  /** The hook that will be called after the component request is failed */
  failed?: (event: BouerEvent) => void;
}
