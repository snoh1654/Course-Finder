import {PersistUtils} from "./PersistUtils";
import {ValidateBasicHelper} from "./ValidateBasicHelper";

const SECTION_KEYS = new Set<string>(["uuid", "id", "title", "instructor", "dept", "year",
	"avg", "pass", "fail", "audit"]);
const M_SECTION = new Set<string>(["year","avg","pass","fail","audit"]);
const S_SECTION = new Set<string>(["uuid", "id", "title", "instructor", "dept"]);
const ROOM_KEYS = new Set<string>(["lat", "lon", "seats", "fullname", "shortname", "number", "name", "address",
	"type", "furniture", "href"]);
const M_ROOMS = new Set<string>(["lat", "lon", "seats"]);
const S_ROOMS = new Set<string>(["fullname", "shortname", "number", "name", "address",
	"type", "furniture", "href"]);
const M_KEYS = new Set<string>(["LT", "GT", "EQ"]);
const S_KEYS = new Set<string>(["IS"]);
const LOGIC_KEYS = new Set<string>(["AND", "OR"]);
const APPLY_TOKEN = new Set<string>(["MAX", "MIN", "AVG", "COUNT", "SUM"]);

export class ValidateHelper {
	private static M: Set<string>;
	private static S: Set<string>;
	private static T: Set<string>;
	public static validateQuery(query: unknown, ids: string[]): boolean {

		const basicQueryResult: any = ValidateBasicHelper.validateBasic(query); // either false or number
		if (basicQueryResult === false) {
			return false;
		}
		const sectionFilter = this.findSectionName(query, basicQueryResult);
		if (sectionFilter === false) {
			return false;
		}
		const underScorePos: number = sectionFilter.indexOf("_");
		const sectionName: string = sectionFilter.slice(0,underScorePos); // store section name and index of underscore

		if (!ids.includes(sectionName)) {
			return false;
		}

		if (!this.initSets(sectionName)) {
			return false;
		}

		return this.validateNested(query, basicQueryResult, sectionName, underScorePos);
	}

	private static initSets(sectionName: string): boolean {
		let resultOfType: string | false = PersistUtils.roomOrSection(sectionName);
		if (resultOfType === "sections") {
			this.M = M_SECTION;
			this.S = S_SECTION;
			this.T = SECTION_KEYS;
			return true;
		} else if (resultOfType === "rooms") {
			this.M = M_ROOMS;
			this.S = S_ROOMS;
			this.T = ROOM_KEYS;
			return true;
		} else {
			return false;
		}
	}

	private static findSectionName(query: any, basicResult: number): string | false {
		if (this.containsTransformation(basicResult)) { // query has transformation
			return query.TRANSFORMATIONS.GROUP[0];
		} else {
			const firstColumn: string =  query.OPTIONS.COLUMNS[0];
			if (firstColumn.includes("_")) {
				return firstColumn;
			} else {
				return false;
			}
		}
	}

	private static containsTransformation(basicResult: number): boolean {
		return basicResult % 2 === 1;
	}

	private static validateNested(query: any, basicResult: number, sectionName: string,
								  underscorePos: number): boolean {
		if (!this.validateInitialWhere(query.WHERE, sectionName, underscorePos)) {
			return false;
		}
		let transformationFilterSet;
		if (this.containsTransformation(basicResult)) {
			transformationFilterSet = this.validateTransformation(query, sectionName, underscorePos);
			if (transformationFilterSet === false) {
				return false;
			}
		}

		let columnsSet;
		if (this.containsTransformation(basicResult)) {
			columnsSet = this.validateColumnsWithTransformation(query.OPTIONS.COLUMNS, transformationFilterSet);
			if (columnsSet === false) {
				return false;
			}
		} else {
			columnsSet = this.validateColumnsWithoutTransformation(query.OPTIONS.COLUMNS, sectionName, underscorePos);
			if (columnsSet === false) {
				return false;
			}
		}

		if (basicResult >= 2) {
			if (basicResult >= 4) {
				return this.validateOrderObject(query.OPTIONS.ORDER,columnsSet);
			} else {
				return this.validateOrderString(query.OPTIONS.ORDER,columnsSet);
			}
		}
		return true;
	}

	private static validateInitialWhere(where: object, sectionName: string, underscorePos: number): boolean {
		if (Object.keys(where).length === 0) {
			return true;
		}
		// where has one key
		return this.validateWhere(where, sectionName, underscorePos);
	}

	private static validateWhere(query: any, sectionName: string, underscorePos: number): boolean {
		if (typeof query === "object") {
			const currentFilter: string[] = Object.keys(query); // create string array of keys
			if (currentFilter.length !== 1) {
				return false;
			}
			const filterKey: string = currentFilter[0];
			if (M_KEYS.has(filterKey)) {
				if (typeof query[filterKey] === "object") {
					return this.validateMComparator(query[filterKey], sectionName, underscorePos);
				} else {
					return false;
				}
			} else if (S_KEYS.has(filterKey)) {
				if (typeof query[filterKey] === "object") {
					return this.validateSComparator(query[filterKey], sectionName, underscorePos);
				} else {
					return false;
				}
			} else if (LOGIC_KEYS.has(filterKey)) {
				if (!Array.isArray(query[filterKey])) {
					return false;
				}
				for (let queryElement of query[filterKey]) {
					if (!this.validateWhere(queryElement, sectionName, underscorePos)) {
						return false;
					}
				}
				return true;
			} else if (filterKey === "NOT") {
				return (this.validateWhere(query[filterKey], sectionName, underscorePos));
			} else { // currentFilter does not fit the query keywords
				return false;
			}
		}
		return false;
	}

	private static validateMComparator(queryObject: any, sectionName: string, underscorePos: number): boolean {
		const filterList = Object.keys(queryObject);
		if (filterList.length !== 1) {
			return false;
		}
		const filter = filterList[0];
		if (this.validateSectionString(filter, sectionName, underscorePos, this.M)) {
			return typeof queryObject[filter] === "number";
		}
		return false;
	}

	private static validateSComparator(queryObject: any, sectionName: string, underscorePos: number): boolean {
		const filterList = Object.keys(queryObject);
		if (filterList.length !== 1) {
			return false;
		}
		const filter = filterList[0];
		if (this.validateSectionString(filter, sectionName, underscorePos, this.S)) {
			return typeof queryObject[filter] === "string";
		}
		return false;
	}

	private static validateTransformation(query: any, sectionName: string, underscorePos: number): Set<string> | false {
		let returnSet = new Set<string>();
		let group: string[] = query.TRANSFORMATIONS.GROUP;
		let apply: object[] = query.TRANSFORMATIONS.APPLY;

		for (let groupElement of group) {
			if (this.validateSectionString(groupElement, sectionName, underscorePos, this.T)) {
				returnSet.add(groupElement);
			} else {
				return false;
			}
		}

		for (let applyObject of apply) {
			// console.log(applyObject);
			let applyKey = this.validateApplyObject(applyObject, sectionName, underscorePos);
			if (applyKey === false) {
				return false;
			} else if (returnSet.has(applyKey)) { // duplicate applyKey
				return false;
			} else {
				returnSet.add(applyKey);
			}
		}

		return returnSet;
	}

	private static validateApplyObject(applyObject: any, sectionName: string, underscorePos: number): false | string {
		if (ValidateBasicHelper.checkObjectLength(applyObject) !== 1) {
			return false;
		}
		let applyObjectKey: string = Object.keys(applyObject)[0];
		let innerApplyObject = applyObject[applyObjectKey];

		if (!ValidateBasicHelper.isNotNullOrUndefinedObject(innerApplyObject)
			|| ValidateBasicHelper.checkObjectLength(innerApplyObject) !== 1) {
			return false;
		}
		let innerObjectKey: string = Object.keys(innerApplyObject)[0];
		let innerObjectValue = innerApplyObject[innerObjectKey];

		if (APPLY_TOKEN.has(innerObjectKey) &&
			this.validateSectionString(innerObjectValue, sectionName, underscorePos, this.T)) {

			if (innerObjectKey !== "COUNT" &&
				!this.M.has(innerObjectValue.slice(underscorePos + 1, innerObjectValue.length))) { // COUNT must have an m-property
				return false;
			}

			return applyObjectKey;
		}

		return false;
	}

	private static validateColumnsWithTransformation(columns: string[], transformationsSet: any): Set<string> | false {
		let columnsSet: Set<string> = new Set([]);
		for (let column of columns) {
			if (!transformationsSet.has(column)) {
				return false;
			}
			columnsSet.add(column);
		}
		return columnsSet;
	}

	private static validateColumnsWithoutTransformation(columns: string[], sectionName: string,
		underscorePos: number): Set<string> | false {
		let columnsSet: Set<string> = new Set([]);
		for (let column of columns) {
			if (!this.validateSectionString(column, sectionName, underscorePos, this.T)) {
				return false;
			}
			columnsSet.add(column);
		}
		return columnsSet;
	}

	private static validateOrderString(orderQuery: string, columnsSet: any): boolean {
		return columnsSet.has(orderQuery);
	}

	private static validateOrderObject(orderQuery: any, columnsSet: any): boolean {
		for (let element of orderQuery.keys) {
			if (!columnsSet.has(element)) {
				return false;
			}
		}
		return true;
	}

	private static validateSectionString(input: string, section: string, underscorePos: number,
										 set: Set<string>): boolean {

		return (input.slice(0,underscorePos) === section && set.has(input.slice(underscorePos + 1, input.length)));
	}
}
