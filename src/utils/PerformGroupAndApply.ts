import Decimal from "decimal.js";

export class PerformGroupAndApply {
	public static groupAndApply(datasetArray: any[], transformationQuery: any, underscorePos: number): any[] {
		let groups: any = this.groupDataset(datasetArray, transformationQuery.GROUP, underscorePos);
		return this.applyGroup(groups, transformationQuery, underscorePos); 
	}

	private static groupDataset(datasetArray: any[], groupKeyArray: string[], underscorePos: number) {
		let firstGroup: string = groupKeyArray[0];
		let firstGroupCategory = firstGroup.slice(underscorePos + 1, firstGroup.length);
		let groupedDatasetObject: any = {};

		for (let dataset of datasetArray) {
			let datasetValue = dataset[firstGroupCategory];
			if (Object.hasOwn(groupedDatasetObject, datasetValue)) {
				groupedDatasetObject[datasetValue].push(dataset);
			} else {
				groupedDatasetObject[datasetValue] = [dataset];
			}
		}

		for (let groupKeyArrayIndex = 1; groupKeyArrayIndex < groupKeyArray.length; groupKeyArrayIndex++) {
			let middleGroup: string = groupKeyArray[groupKeyArrayIndex];
			let middleGroupCategory = middleGroup.slice(underscorePos + 1, middleGroup.length);

			groupedDatasetObject = this.groupDatasetMultiple(groupedDatasetObject, middleGroupCategory); // ERROR PRONE
			if (Object.keys(groupedDatasetObject).length === datasetArray.length) {
				break;
			}
		}

		return groupedDatasetObject;
	}

	private static groupDatasetMultiple(groupedDatasetObject: any, groupKey: string) {
		let returnGroupedObject: any = {};
		for (const groupValue in groupedDatasetObject) { 

			for (let dataset of groupedDatasetObject[groupValue]) {
				const datasetValue = dataset[groupKey];
				const newKey: string = groupValue + "," + datasetValue;

				if (Object.hasOwn(returnGroupedObject, newKey)) {
					returnGroupedObject[newKey].push(dataset);
				} else {
					returnGroupedObject[newKey] = [dataset];
				}
			}
		}

		return returnGroupedObject;
	}

	private static applyGroup(groups: any, transformationQuery: any, underscorePos: number): any[] {
		const groupQuery = transformationQuery.GROUP;
		const applyQuery = transformationQuery.APPLY;

		const condensedGroups: any[] = [];

		for (const group in groups) {
			let condensedGroup: any = {};
			let firstDatasetInGroup = groups[group][0];

			for (const groupKey of groupQuery) {
				condensedGroup[groupKey] = firstDatasetInGroup[groupKey.slice(underscorePos + 1, groupKey.length)];
			} // condensed group contains everything but apply keys

			for (const applyObject of applyQuery) {
				const applyKey: string = Object.keys(applyObject)[0];
				const innerObject = applyObject[applyKey];
				const innerKey: string = Object.keys(innerObject)[0];
				const innerValue: string = innerObject[innerKey];
				const innerValueField: string = innerValue.slice(underscorePos + 1, innerValue.length);

				let value: number;

				switch(innerKey) {
					case "MAX":
						value = this.getMaxApply(groups[group], innerValueField);
						break;
					case "MIN":
						value = this.getMinApply(groups[group], innerValueField);
						break;
					case "AVG":
						value = this.getAvgApply(groups[group], innerValueField);
						break;
					case "SUM":
						value = this.getSumApply(groups[group], innerValueField);
						break;
					default: // COUNT
						value = this.getCountApply(groups[group], innerValueField);
						break;
				}

				condensedGroup[applyKey] = value;
			}

			condensedGroups.push(condensedGroup);
		}

		return condensedGroups;
	}

	private static getMaxApply(datasets: any[], field: string): number {
		let maxValue: number = Number.NEGATIVE_INFINITY;
		for (const dataset of datasets) {
			if (dataset[field] > maxValue) {
				maxValue = dataset[field];
			}
		}

		return maxValue;
	}

	private static getMinApply(datasets: any[], field: string): number {
		let minValue: number = Number.POSITIVE_INFINITY;
		for (const dataset of datasets) {
			if (dataset[field] < minValue) {
				minValue = dataset[field];
			}
		}

		return minValue;
	}

	private static getAvgApply(datasets: any[], field: string): number {
		let sum: Decimal = new  Decimal(0);
		for (const dataset of datasets) {
			sum = sum.add(dataset[field]);
		}
		let avg = (sum.toNumber() / datasets.length);

		return Number(avg.toFixed(2));
	}

	private static getSumApply(datasets: any[], field: string): number {
		let sum: number = 0;
		for (const dataset of datasets) {
			sum += dataset[field];
		}

		return Number(sum.toFixed(2));
	}

	private static getCountApply(datasets: any[], field: string): number {
		let countSet: Set<string> = new Set<string>([]);
		for (const dataset of datasets) {
			let value = dataset[field];
			if (!countSet.has(value)) {
				countSet.add(value);
			}
		}
		return countSet.size;
	}
}
