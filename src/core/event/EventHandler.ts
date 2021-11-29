import Bouer from "../../instance/Bouer";
import { Constants } from "../../shared/helpers/Constants";
import IoC from "../../shared/helpers/IoC";
import {
	buildError,
	connectNode,
	createEl,
	forEach,
	isFunction,
	isNull,
	taskRunner,
	toLower,
	trim,
	where
} from "../../shared/helpers/Utils";
import Logger from "../../shared/logger/Logger";
import dynamic from "../../types/dynamic";
import Evaluator from "../Evaluator";

type EventModifiers = {
	capture?: boolean;
	once?: boolean;
	passive?: boolean;
	signal?: AbortSignal;
}

export type EventEmitterOptions = {
	eventName: string
	init?: CustomEventInit,
	once?: boolean,
	attachedNode?: Node
}

export type EventSubscription = {
	eventName: string
	attachedNode?: Node,
	modifiers?: EventModifiers,
	callback: (evt: Event | CustomEvent, ...args: any[]) => void,
	emit: (options?: { init?: CustomEventInit, once?: boolean, }) => void
}

export default class EventHandler {
	private bouer: Bouer;
	private evaluator: Evaluator;
	private $events: { [key: string]: EventSubscription[] } = {};
	private input = createEl('input').build();

	constructor(bouer: Bouer) {
		this.bouer = bouer;
		this.evaluator = IoC.Resolve('Evaluator')!;

		IoC.Register(this);
		this.cleanup();
	}

	handle(node: Node, data: object, context: object) {
		const ownerElement = ((node as any).ownerElement || node.parentNode) as Element;
		const nodeName = node.nodeName;

		if (isNull(ownerElement))
			return Logger.error("Invalid ParentElement of “" + nodeName + "”");

		// <button on:submit.once.stopPropagation="times++"></button>
		const nodeValue = trim(node.nodeValue ?? '');

		const eventNameWithModifiers = nodeName.substr(Constants.on.length);
		const modifiersList = eventNameWithModifiers.split('.');
		const eventName = modifiersList[0];
		modifiersList.shift();

		if (nodeValue === '')
			return Logger.error("Expected an expression in the “" + nodeName + "” and got an <empty string>.");

		connectNode(node, ownerElement);
		ownerElement.removeAttribute(nodeName);

		const callback = (evt: CustomEvent | Event) => {
			// Calling the modifiers
			forEach(modifiersList, modifier => {
				forEach(Object.keys(evt), key => {
					let fnModifier;
					if (fnModifier = (evt as any)[key] && isFunction(fnModifier) && toLower(key) === toLower(modifier))
						fnModifier();
				})
			});

			const mArguments = [evt];
			const isResultFunction = this.evaluator.exec({
				data: data,
				expression: nodeValue,
				args: mArguments,
				aditional: { event: evt },
				context: context
			});

			if (isFunction(isResultFunction)) {
				try {
					(isResultFunction as Function).apply(context, mArguments);
				} catch (error) {
					Logger.error(buildError(error));
				}
			}
		}

		const modifiers: dynamic = {};
		const addEventListenerOptions = ['capture', 'once', 'passive'];
		forEach(modifiersList, md => {
			md = md.toLocaleLowerCase();
			if (addEventListenerOptions.indexOf(md) !== -1)
				modifiers[md] = true;
		});

		if (!('on' + eventName in this.input))
			this.on({ eventName, callback, modifiers, context, attachedNode: ownerElement });
		else
			ownerElement.addEventListener(eventName, callback, modifiers);
	}

	on(options: {
		eventName: string,
		callback: (event: CustomEvent | Event) => void,
		attachedNode?: Node,
		context: object,
		modifiers?: EventModifiers
	}) {
		const { eventName, callback, context, attachedNode, modifiers } = options;
		const event: EventSubscription = {
			eventName: eventName,
			callback: evt => callback.apply(context || this.bouer, [evt]),
			attachedNode: attachedNode,
			modifiers: modifiers,
			emit: options => this.emit({
				eventName: eventName,
				attachedNode: attachedNode,
				init: (options || {}).init,
				once: (options || {}).once,
			})
		};

		if (!this.$events[eventName])
			this.$events[eventName] = [];

		this.$events[eventName].push(event);
		return event;
	}

	off(options: {
		eventName: string,
		callback: (event: CustomEvent | Event) => void,
		attachedNode?: Node
	}) {

		const { eventName, callback, attachedNode } = options;
		if (!this.$events[eventName])
			return;

		this.$events[eventName] = where(this.$events[eventName], evt => {
			if (attachedNode)
				return (evt.attachedNode === attachedNode)

			return !(evt.eventName === eventName && callback == evt.callback);
		});
	}

	emit(options: EventEmitterOptions) {
		const { eventName, init, once, attachedNode } = options;
		const events = this.$events[eventName];

		if (!events)
			return;

		const emitter = (node: Node, callback: any) => {
			node.addEventListener(eventName, callback, { once: true });
			node.dispatchEvent(new CustomEvent(eventName, init));
		}

		forEach(events, (evt, index) => {
			const node = evt.attachedNode;

			// If a node was provided, just dispatch the events in this node
			if (attachedNode) {
				if (node !== attachedNode) return;
				return emitter(node, evt.callback);
			}

			// Otherwise, if this events has a node, dispatch the node event
			if (node) return emitter(node, evt.callback);

			// Otherwise, dispatch all events
			evt.callback.call(this.bouer, new CustomEvent(eventName, init));
			if ((once ?? false) === true)
				events.splice(index, 1);
		});
	}

	private cleanup() {
		taskRunner(() => {
			forEach(Object.keys(this.$events), key => {
				this.$events[key] = where(this.$events[key], event => {
					if (!event.attachedNode) return true;
					if (event.attachedNode.isConnected) return true;
				});
			});
		}, 1000);
	}
}
