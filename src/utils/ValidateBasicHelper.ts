export class ValidateBasicHelper {
	public static validateBasic(query: any): false | number {
		let returnValue = 0;
		if (this.isNotNullOrUndefinedObject(query)) {  // query is a non-null object
			if (this.isKeyInObject(query, ["WHERE", "OPTIONS"]) && this.checkObjectLength(query) <= 3) { // query contains keys: where and options
				if (this.checkObjectLength(query) === 3) { // if query contains transformation, the basics of the transformation section is valid
					if (!this.validateTransformationsBasic(query)) {
						return false;
					}
					returnValue += 1;
				}
				if (this.isNotNullOrUndefinedObject(query.WHERE) && this.isNotNullOrUndefinedObject(query.OPTIONS)) { // WHERE and OPTIONS are an object that are not null or undefined
					if (this.checkObjectLength(query.OPTIONS) <= 2 && "COLUMNS" in query.OPTIONS
						&& this.checkIsArray(query.OPTIONS.COLUMNS, 1)
						&& typeof query.OPTIONS.COLUMNS[0] === "string") { // OPTIONS contains COLUMNS and COLUMNS is a string array with at least one element
						if (this.checkObjectLength(query.OPTIONS) === 2) { // case where OPTIONS also contains ORDER
							if ("ORDER" in query.OPTIONS && typeof query.OPTIONS.ORDER === "string") { // case where ORDER is just a string
								return returnValue + 2;
							} else if ("ORDER" in query.OPTIONS && this.isNotNullOrUndefinedObject(query.OPTIONS.ORDER)
								&& this.validateObjectOrder(query.OPTIONS.ORDER)) { // case where ORDER is an object
								return returnValue + 4;
							}
						} else { // case where OPTIONS does not contain ORDER
							return returnValue;
						}
					}
				}
			}
		}
		return false;
	}

	private static validateTransformationsBasic(query: any): boolean {
		let returnValue = this.isKeyInObject(query, ["TRANSFORMATIONS"]) // query contains TRANSFORMATION
			&& this.isNotNullOrUndefinedObject(query.TRANSFORMATIONS) // TRANSFORMATION is a non-null/undefined object
			&& this.isKeyInObject(query.TRANSFORMATIONS, ["GROUP", "APPLY"]) // GROUP and APPLY is in TRANSFORMATION
			&& this.checkObjectLength(query.TRANSFORMATIONS) === 2 // TRANSFORMATION only contains GROUP and APPLY
			&& this.checkIsArray(query.TRANSFORMATIONS.GROUP, 1) // GROUP is an array of length >= 1
			&& this.checkIsArray(query.TRANSFORMATIONS.APPLY, 0) // APPLY is an array of length >= 0
			&& typeof query.TRANSFORMATIONS.GROUP[0] === "string"; // GROUP is a string array
		if (query.TRANSFORMATIONS.APPLY.size > 0 && typeof query.TRANSFORMATIONS.APPLY[0] !== "object") { // if APPLY length > 0, it contains objects
			returnValue = false;
		}
		return returnValue;
	}

	private static validateObjectOrder(query: any): boolean {
		return this.isKeyInObject(query, ["dir", "keys"]) && this.checkObjectLength(query) === 2
			&& (query.dir === "UP" || query.dir === "DOWN") && this.checkIsArray(query.keys, 1)
			&& typeof query.keys[0] === "string" ;
	}

	private static checkIsArray(array: any, size: number): boolean {
		return Array.isArray(array) && array.length >= size;
	}

	public static checkObjectLength(query: any): number {
		return Object.keys(query).length;
	}

	private static isKeyInObject(query: any, keys: string[]): boolean {
		for (let key of keys) {
			if (!(key in query)) {
				return false;
			}
		}
		return true;
	}

	public static isNotNullOrUndefinedObject(query: any) {
		return typeof query === "object" && query !== null && query !== undefined;
	}
}
