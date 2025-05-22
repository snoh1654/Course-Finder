import {InsightResult} from "../controller/IInsightFacade";
import {PerformGroupAndApply} from "./PerformGroupAndApply";

const M_KEYS = new Set<string>(["LT", "GT", "EQ"]);
const S_KEYS = new Set<string>(["IS"]);
export class PerformQueryHelper {
	public static returnQuery(datasetArray: any[], query: any, underscorePos: number): InsightResult[] {
		this.filterDatasetArray(datasetArray, query, underscorePos); // filter array according to where
		if (Object.keys(query).includes("TRANSFORMATIONS")) {
			let groupedDataset = PerformGroupAndApply.groupAndApply(datasetArray, query.TRANSFORMATIONS, underscorePos); // create groups and find information according to APPLY
			this.specifyGroupedDataset(groupedDataset, query.OPTIONS.COLUMNS, underscorePos);
			this.sortDatasetArray(groupedDataset, query); // sort array according to order if it exists
			console.log("SORTED");
			console.log(groupedDataset);
			return groupedDataset;
		} else {
			this.specifyDatasetArray(datasetArray, query.OPTIONS.COLUMNS, underscorePos); // only include required information according to columns
			this.sortDatasetArray(datasetArray, query); // sort array according to order if it exists
			return datasetArray;
		}
	}

	private static filterDatasetArray(datasetArray: any[], query: any, underscorePos: number): void {
		if (Object.keys(query.WHERE).length === 0) {
			return;
		}
		for (let i: number = datasetArray.length - 1; i >= 0; i--) {
			if (!this.filterDataset(datasetArray[i], query.WHERE, underscorePos)) {
				datasetArray.splice(i, 1);
			}
		}
	}

	private static filterDataset(section: any, query: any, underscorePos: number): boolean {
		const currentFilter: string[] = Object.keys(query); // create string array of keys
		const filterKey: string = currentFilter[0];
		if (M_KEYS.has(filterKey)) {
			return this.filterMKey(section, query[filterKey], filterKey, underscorePos);
		} else if (S_KEYS.has(filterKey)) {
			return this.filterSKey(section, query[filterKey], underscorePos);
		} else if (filterKey === "AND") {
			for (let queryElement of query[filterKey]) {
				if (!this.filterDataset(section, queryElement, underscorePos)) {
					return false;
				}
			}
			return true;
		} else if (filterKey === "OR") {
			for (let queryElement of query[filterKey]) {
				if (this.filterDataset(section, queryElement, underscorePos)) {
					return true;
				}
			}
			return false;
		} else if (filterKey === "NOT") {
			return !(this.filterDataset(section, query[filterKey], underscorePos));
		} else {
			console.log("filterDataset is failing because validation failed");
			return false;
		}
	}

	private static filterMKey(section: any, query: any, operator: string, underscorePos: number): boolean {
		const queryString: string = Object.keys(query)[0];
		const filter: string = queryString.substring(underscorePos + 1, queryString.length);
		const value: number = query[queryString];
		return this.filterMKeyHelper(operator, section[filter], value);
	}

	public static filterMKeyHelper(operator: string, actual: number, value: number) {
		switch (operator) {
			case "LT":
				return actual < value;
			case "GT":
				return actual > value;
			case "EQ":
				return actual === value;
		}
		return false;
	}

	private static filterSKey(section: any, query: any, underscorePos: number): boolean {
		const queryString: string = Object.keys(query)[0];
		const filter: string = queryString.substring(underscorePos + 1, queryString.length);
		const value: string = query[queryString];
		return this.filterSKeyHelper(value, section[filter]);
	}

	public static filterSKeyHelper(value: string, actual: string) {
		const valueLength: number = value.length;
		const actualStringLength: number = actual.length;
		switch (this.checkWildCard(value)) {
			case 0: // exact
				return value === actual;
			case 1: // ending same
				return value.slice(1) === actual.slice(actualStringLength - valueLength + 1, actualStringLength);
			case 2: // starting same
				return value.slice(0, valueLength - 1) === actual.slice(0, valueLength - 1);
			case 3: // contains
				return actual.includes(value.slice(1, valueLength - 1));
		}
		return false;
	}

	public static checkWildCard(input: string): number {
		const stringLength: number = input.length;
		if (input.substring(0, 1) === "*") {
			if (input.substring(stringLength - 1, stringLength) === "*") {
				return 3;
			}
			return 1;
		} else if (input.substring(stringLength - 1, stringLength) === "*") {
			return 2;
		} else {
			return 0;
		}
	}

	private static specifyDatasetArray(datasetArray: any[], query: string[], underscorePos: number): void {
		const columnSet: Set<string> = new Set<string>();
		const sectionName: string = query[0].slice(0, underscorePos);
		for (let column of query) {
			columnSet.add(column.slice(underscorePos + 1, column.length));
		} // create a set of the columns, id, iid, prof

		for (let section of datasetArray) { // iterate through dataset array
			for (let property in section) { // iterate through one section
				if (!columnSet.has(property)) { // if the section contains a property not in the set, remove that property
					delete section[property];
				} else {
					let newProperty: string = sectionName + "_" + property;
					section[newProperty] = section[property];
					delete section[property];
				}
			}
		}
	}

	private static specifyGroupedDataset(datasetArray: any[], query: string[], underscorePos: number): void {
		const columnSet: Set<string> = new Set<string>();
		let sectionName: string = "";
		for (let queryString of query) {
			if (this.isNotApplyKey(queryString)) {
				sectionName = queryString.slice(0, underscorePos);
				break;
			}
		}

		for (let column of query) {
			columnSet.add(column);
		}

		for (let dataset of datasetArray) { // iterate through dataset array

			for (let property in dataset) { // iterate through one dataset

				if (!columnSet.has(property)) { // if the section contains a property not in the set, remove that property
					delete dataset[property];
				}
			}
		}
	}

	private static isNotApplyKey(key: string): boolean {
		return key.includes("_");
	}

	public static sortDatasetArray(datasetArray: any[], query: any): void {
		if (!Object.keys(query.OPTIONS).includes("ORDER")) {
			return;
		}

		if (typeof query.OPTIONS.ORDER === "string") { // string order
			this.sortStringDatasetArray(datasetArray, query);
		} else { // object order
			this.sortObjectDatasetArray(datasetArray, query);
		}
	}

	private static sortStringDatasetArray(datasetArray: any[], query: any): void {
		const orderString: string = query.OPTIONS.ORDER;
		this.performSort(datasetArray, [orderString]);
	}

	private static sortObjectDatasetArray(datasetArray: any[], query: any): void {
		const orderObject: any = query.OPTIONS.ORDER;
		const direction: string = orderObject["dir"];
		const keys: string[] = orderObject["keys"];

		this.performSort(datasetArray, keys);

		if (direction === "DOWN") {
			datasetArray.reverse();
		}
	}

	private static performSort(datasetArray: any[], keys: string[]): void {
		datasetArray.sort((a: any, b: any) => {
			for (let orderKey of keys) {
				if (a[orderKey] < b[orderKey]) {
					return -1;
				}
				if (a[orderKey] > b[orderKey]) {
					return 1;
				}
			}
			return 0;
		});
	}
}
