import dynamic from "../../definitions/types/Dynamic";
import Bouer from "../../instance/Bouer";
import IoC from "../../shared/helpers/IoC";
import Logger from "../../shared/logger/Logger";
import Base from "../Base";

export default class DataStore extends Base {
  wait: { [key: string]: { nodes: Element[], data?: object } } = {};
  data: dynamic = {};
  req: dynamic = {};
	bouer: Bouer;

  constructor(bouer: Bouer) {
		super();

		this.bouer = bouer;
		IoC.Register(this);
	}

  set<TKey extends keyof DataStore>(key: TKey, dataKey: string, data: object) {
    if (key === 'wait') return Logger.warn("Only “get” is allowed for type of data");
    IoC.Resolve<any>(this.bouer, DataStore)[key][dataKey] = data;
  }

  get<TKey extends keyof DataStore>(key: TKey, dataKey: string, once?: boolean) {
    const result = IoC.Resolve<any>(this.bouer, DataStore)[key][dataKey];
    if (once === true) this.unset(key, dataKey);
    return result;
  }

  unset<TKey extends keyof DataStore>(key: TKey, dataKey: string) {
    delete IoC.Resolve<any>(this.bouer, DataStore)[key][dataKey]
  }
}
