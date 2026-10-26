export interface Config {
  ansible?: {
    'hello-world'?: {
      /**
       * Enables the Hello World entity tab.
       * @visibility frontend
       */
      enabled?: boolean;
    };
  };
}
