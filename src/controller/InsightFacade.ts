import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
	ResultTooLargeError
} from "./IInsightFacade";

import Dataset from "../models/Dataset";

import {AddSectionUtils} from "../utils/AddSectionUtils";
import {GeneralUtils} from "../utils/GeneralUtils";

import fs from "fs-extra";
import {PerformQueryHelper} from "../utils/PerformQueryHelper";
import {ValidateHelper} from "../utils/ValidateHelper";
import {PersistUtils} from "../utils/PersistUtils";
import {AddRoomUtils} from "../utils/AddRoomUtils";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */

export default class InsightFacade implements IInsightFacade {
	private map: Map<string, Dataset>;
	private readonly directory: string = "./data/";

	constructor() {
		this.map = new Map<string, Dataset>();
	}

	public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		if (GeneralUtils.isErroneousId(id) || this.map.has(id) || PersistUtils.getFileNamesSync().includes(id) ||
			!content) {
			return Promise.reject(new InsightError());
		}

		if (kind === InsightDatasetKind.Sections) {
			return AddSectionUtils.processDataset(content).then((value) => {
				let numRows = value.length;
				let iDataset: InsightDataset = {id, kind, numRows};
				let dataset: Dataset = new Dataset(iDataset, value);
				this.map.set(id, dataset);

				let data = JSON.parse(JSON.stringify(value));
				fs.createFileSync(this.directory + id + "_sections.json");
				fs.writeJSONSync(this.directory + id + "_sections.json", data, {spaces: "\t", EOL: "\n"});

				return Promise.resolve(PersistUtils.getFileNamesSync());
			}).catch((reason) => {
				return Promise.reject(new InsightError());
			});
		}

		if (kind === InsightDatasetKind.Rooms) {
			return AddRoomUtils.processRooms(content).then((value) => {
				let numRows = value.length;
				let iDataset: InsightDataset = {id, kind, numRows};
				let dataset: Dataset = new Dataset(iDataset, value);
				this.map.set(id, dataset);

				let data = JSON.parse(JSON.stringify(value));
				fs.createFileSync(this.directory + id + "_rooms.json");
				fs.writeJSONSync(this.directory + id + "_rooms.json", data, {spaces: "\t", EOL: "\n"});

				return Promise.resolve(PersistUtils.getFileNamesSync());
			}).catch((reason) => {
				return Promise.reject(new InsightError());
			});
		}

		return Promise.reject(new InsightError());
	}

	public removeDataset(id: string): Promise<string> {
		if (GeneralUtils.isErroneousId(id)) {
			return Promise.reject(new InsightError());
		}
		if (!this.map.has(id) && !PersistUtils.getFileNamesSync().includes(id)) {
			return Promise.reject(new NotFoundError());
		}

		let a = "";

		if (fs.existsSync(this.directory + id + "_sections.json")) {
			a = "_sections";
		} else if (fs.existsSync(this.directory + id + "rooms.json")) {
			a = "_rooms";
		}
		this.map.delete(id);
		fs.removeSync(this.directory + id + a + ".json");
		return Promise.resolve(id);
	}

	public performQuery(query: unknown): Promise<InsightResult[]> {
		if (!ValidateHelper.validateQuery(query, PersistUtils.getFileNamesSync())) {
			return Promise.reject(new InsightError("Error, There does not exist a dataset with that name"));
		}
		// Query is now properly formatted

		// get the json file from disk and make it an object
		// read info from query and filter the string array
		// format the string array into columns
		// sort the array
		// return the formatted results
		const inputQuery: any = query;

		let firstColumn: string = inputQuery.OPTIONS.COLUMNS[0];
		if (!firstColumn.includes("_")) {
			firstColumn = inputQuery.TRANSFORMATIONS.GROUP[0];
		}
		const underscorePos: number = firstColumn.indexOf("_");
		const sectionName: string = firstColumn.slice(0,underscorePos);
		let dataType: string | false = PersistUtils.roomOrSection(sectionName);
		const dataSetLocation = this.directory + sectionName + "_" + dataType + ".json";
		const datasetArray: any = fs.readJsonSync(dataSetLocation);
		const queriedArray: InsightResult[] = PerformQueryHelper.returnQuery(datasetArray, query, underscorePos);
		if (queriedArray.length > 5000) {
			return Promise.reject(new ResultTooLargeError("Error, Result over 5000 items"));
		}
		return Promise.resolve(queriedArray);
	}

	public listDatasets(): Promise<InsightDataset[]> {
		let insightDatasets: InsightDataset[] = [];
		let dataFiles = PersistUtils.getFileNamesSync();
		dataFiles.forEach((value) => {
			if (fs.existsSync(this.directory + value + "_sections.json")) {
				let size = JSON.parse(fs.readFileSync(this.directory + value + "_sections.json", "utf8")).length;
				insightDatasets.push({id: value, kind: InsightDatasetKind.Sections, numRows: size});
			} else if (fs.existsSync(this.directory + value + "_rooms.json")) {
				let size = JSON.parse(fs.readFileSync(this.directory + value + "_rooms.json", "utf8")).length;
				insightDatasets.push({id: value, kind: InsightDatasetKind.Rooms, numRows: size});
			}
		});
		return Promise.resolve(insightDatasets);
	}
}
