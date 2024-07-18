export class GeneralUtils {
	public static isOnlyWhiteSpaces(id: string): boolean {
		let i: number = 0;
		while (i < id.length) {
			if (id[i] !== " ") {
				return false;
			}
			i++;
		}
		return true;
	}

	public static isErroneousId(id: string): boolean {
		return this.isOnlyWhiteSpaces(id) || id.includes("_");
	}
}
