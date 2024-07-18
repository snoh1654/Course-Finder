import Section from "./Section";
import {InsightDataset} from "../controller/IInsightFacade";
import Room from "./Room";

export default class Dataset {
	public insightDataset: InsightDataset;
	public data: Section[] | Room[];

	constructor(insightDataset: InsightDataset, data: Section[] | Room[]) {
		this.insightDataset = insightDataset;
		this.data = data;
	}
}
