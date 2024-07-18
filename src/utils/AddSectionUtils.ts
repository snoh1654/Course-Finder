import Section from "../models/Section";
import JSZip from "jszip";
import {InsightError} from "../controller/IInsightFacade";

export class AddSectionUtils {

	private static readonly directory = "courses/";
	private static readonly directoryLength = this.directory.length;

	public static processDataset(content: string): Promise<Section[]> {

		let z = new JSZip();
		let result = z.loadAsync(content, {base64: true})
			.then((zip) => {
				let sections: Section[] = [];
				let promisedSections: Array<Promise<any>> = [];
				zip.forEach((relativePath, file) => {
					if (relativePath.length > this.directoryLength &&
						relativePath.substring(0, this.directoryLength) === this.directory) {
						promisedSections.push(this.processFile(sections, zip, file.name));
					}
				});

				return Promise.all(promisedSections).then(() => {
					let validDataset: boolean = this.isValidDataset(sections);
					if (validDataset) {
						return Promise.resolve(sections);
					} else {
						return Promise.reject(new InsightError());
					}
				}).catch(() => {
					return Promise.reject(new InsightError());
				});
			}).catch(() => {
				return Promise.reject(new InsightError());
			});
		return result;
	}

	public static isValidDataset(sections: Section[]): boolean {
		return sections.length !== 0;
	}

	public static async processFile(sections: Section[], zip: JSZip, file: string): Promise<void> {
		await zip.files[file].async("string").then((course) => {
			let newSections = this.processJSON(JSON.parse(course));
			for (let section of newSections) {
				sections.push(section);
			}
		}).catch((err) => {
			// do nothing if invalid
		});

	}

	public static processJSON(json: any): Section[] {
		let avgs: number[] = [];
		let passes: number[] = [];
		let fails: number[] = [];
		let audits: number[] = [];
		let years: number[] = [];
		let depts: string[] = [];
		let ids: string[] = [];
		let instructors: string[] = [];
		let titles: string[] = [];
		let uuids: string[] = [];
		// determiner of year
		let section: string[] = [];
		json["result"].forEach((element: any) => {
			avgs.push(element["Avg"]);
			passes.push(element["Pass"]);
			fails.push(element["Fail"]);
			audits.push(element["Audit"]);
			years.push(element["Year"]);
			depts.push(element["Subject"]);
			ids.push(element["Course"]);
			instructors.push(element["Professor"]);
			titles.push(element["Title"]);
			uuids.push(element["id"]);
			section.push(element["Section"]);
		});
		let sections: Section[] = [];
		for (let i = 0; i < avgs.length; i++) {
			if (avgs[i] !== undefined || passes[i] !== undefined || fails[i] !== undefined || audits[i] !== undefined ||
				years[i] !== undefined || depts[i] !== undefined || ids[i] !== undefined ||
				instructors[i] !== undefined || titles[i] !== undefined || uuids[i] !== undefined) {
				if (section[i] === "overall") {
					sections.push(new Section(avgs[i], passes[i], fails[i], audits[i], 1900,
						depts[i], ids[i], instructors[i], titles[i], uuids[i].toString()));
				} else {
					sections.push(new Section(avgs[i], passes[i], fails[i], audits[i], parseInt(String(years[i]), 10),
						depts[i], ids[i], instructors[i], titles[i], uuids[i].toString()));
				}
			}
		}
		return sections;
	}
}
