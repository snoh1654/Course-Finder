export class HTMLUtils {
	public static checkTdsValid(td_values: any[], value: string): boolean {
		if (!td_values) {
			return false;
		} else {
			return (td_values.filter((td_value) => td_value.value.includes(value)
				&& td_value.name === "class")).length === 1;
		}
	}

	public static checkHrefValid(td_values: any[], value: string): boolean {
		if (!td_values) {
			return false;
		} else {
			return (td_values.filter((td_value) => td_value.value.includes(value)
				&& td_value.name === "href")).length === 1;
		}
	}

	public static getLabel(child: any[], type: string): string {
		if (child && Array.isArray(child)) {
			if (type === "#text") {
				let filter: any[] = child.filter((condition) => condition.nodeName === "#text");
				return filter[0].value.trim();
			} else if (type === "href") {
				let filter: any[] = child.filter((condition: any) => condition.name === "href");
				return filter[0].value;
			} else {
				throw Error();
			}
		} else {
			throw Error();
		}
	}

	public static getHref(child: any[]): string {
		const filter = this.getAFilter(child);
		if (filter.length) {
			return this.getLabel(filter[0].attrs, "href");
		} else {
			throw Error();
		}
	}

	public static getLabelWrapA(child: any[]): string {
		const filter = this.getAFilter(child);
		if (filter.length) {
			return this.getLabel(filter[0].childNodes, "#text");
		} else {
			throw Error();
		}
	}

	public static getAFilter(child: any[]) {
		let filter1 = child.filter((a) => a.nodeName === "a");
		return filter1.filter((node) => this.checkHrefValid(node.attrs, "/"));
	}
}
