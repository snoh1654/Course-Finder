import fs from "fs-extra";

export class PersistUtils {
	private static readonly directory: string = "./data/";

	public static getFileNamesSync(): string[] {
		if (fs.existsSync(this.directory)) {
			let dataFiles = fs.readdirSync(this.directory);
			dataFiles = dataFiles.map((x) => x.substring(0, x.lastIndexOf("_")));
			return dataFiles;
		} else {
			return [];
		}
	}

	public static roomOrSection(name: string): string | false {
		let dataFiles = fs.readdirSync(this.directory);
		let output = "";
		dataFiles.forEach((value, index, array) => {
			if (name === value.substring(0, value.lastIndexOf("_"))) {
				if (value.substring(value.lastIndexOf("_")) === "_sections.json") {
					output = "sections";
				} else if (value.substring(value.lastIndexOf("_")) === "_rooms.json") {
					output = "rooms";
				}
			}
		});
		if (output !== "") {
			return output;
		} else {
			return false;
		}
	}
}
