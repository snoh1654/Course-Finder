import JSZip, {JSZipObject} from "jszip";
import {parse} from "parse5";
import Room from "../models/Room";
import Building from "../models/Building";
import * as http from "http";
import RoomData from "../models/RoomData";
import {HTMLUtils} from "./HTMLUtils";

const geoResponseURL = "http://cs310.students.cs.ubc.ca:11316/api/v1/";
interface GeoResponse {
	lat?: number;
	lon?: number;
	error?: string;
}

export class AddRoomUtils {
	public static async processRooms(content: string) {
		let buildings: Building[] = [];
		let z = new JSZip();
		let indexString = await this.getIndexString(content, z);
		if (indexString == null) {
			indexString = "";
		}

		let indexDocument = parse(indexString);
		indexDocument.childNodes.forEach((value, index, array) => {
			if(value.nodeName === "html") {
				buildings = this.traverseDocument(value);
			}
		});

		let roomFiles = await this.getBuildingFiles(content, z);
		let promisedRooms: Array<Promise<any>> = [];
		let rooms: Room[] = [];
		for (let i in buildings) {
			let savedBuilding: string;
			promisedRooms.push(this.getBuilding(roomFiles, buildings[i].href).then((building) => {
				savedBuilding = building;  // HTML of current building
				return this.getGeoResponse(buildings[i].address);
			}).then((geoResponse) => {
				if (geoResponse.lat == null || geoResponse.lon == null) {
					throw Error();
				} else {
					return this.getRooms(savedBuilding, buildings[i], geoResponse);
				}
			}).then((roomArr) => {
				for (let j in roomArr) {
					rooms.push(roomArr[j]);
				}
			}).catch((err) => {
				// err somewhere, current iteration is not valid building, skip to next building
			}));
		}

		return Promise.all(promisedRooms).then(() => {
			if (rooms.length === 0) {
				return Promise.reject();
			}
			// console.log(rooms.length);
			return rooms;
		}).catch((err) => {
			return Promise.reject(err);
		});
	}

	public static getBuildingFiles(content: string, z: JSZip) {
		return z.loadAsync(content, {base64: true}).then(() => {
			return z.filter((pathName: string, file: JSZip.JSZipObject) => {
				return (file.name.startsWith("campus/discover/buildings-and-classrooms/"));
			});
		}).catch((err) => {
			return Promise.reject(err);
		});
	}

	public static async getIndexString(content: string, z: JSZip) {
		return (await z.loadAsync(content, {base64: true}).then((zip) => {
			if (!zip.file("index.htm")) {
				return Promise.reject();
			} else if (zip.filter((relativePath, file) => {
				return (file.name.startsWith("campus/discover/buildings-and-classrooms/"));
			}).length === 0) {
				return Promise.reject();
			}
			return zip;
		})).file("index.htm")?.async("string");
	}

	public static getRooms(buildingHtmlFile: string, buildingInfo: Building, geoResponse: GeoResponse): Room[] {
		let buildingDocument = parse(buildingHtmlFile);
		let roomdatas: RoomData[] = this.traverseDocumentBuilding(buildingDocument);
		let rooms: Room[] = [];
		if (geoResponse.lat !== undefined && geoResponse.lon !== undefined) {
			for (let i in roomdatas) {
				rooms.push(new Room(
					buildingInfo.fullname,
					buildingInfo.shortname,
					roomdatas[i].number,
					buildingInfo.shortname + "_" + roomdatas[i].number,
					buildingInfo.address,
					roomdatas[i].type,
					roomdatas[i].furniture,
					roomdatas[i].href,
					geoResponse.lat,
					geoResponse.lon,
					roomdatas[i].seats
				));
			}
		}
		if (rooms.length === 0) {
			throw Error();
		} else {
			return rooms;
		}
	}

	public static getBuilding(roomFiles: JSZipObject[], name: string) {
		for (let i in roomFiles) {
			if (name.substring(2, name.length) === roomFiles[i].name) {
				return roomFiles[i].async("string");
			}
		}
		throw Error();
	}

	public static getGeoResponse(name: string): Promise<GeoResponse> {
		let link = geoResponseURL + "project_team016/" + encodeURIComponent(name);
		return new Promise((resolve, reason) => {
			http.get(link, (res) => {
				res.on("data", function (content) {
					let geoResponseJson = JSON.parse(content);
					let geoResponse = {
						lat: geoResponseJson.lat,
						lon: geoResponseJson.lon,
						error: geoResponseJson.error
					};
					if (geoResponse.error) {
						return reason(geoResponse.error);
					} else {
						return resolve(geoResponse);
					}
				});
			}).on("error", function () {
				return reason();
			});
		});
	}

	public static traverseDocument(value: any): Building[] {
		let buildings: Building[] = [];
		if (!value || !value.childNodes) {
			return [];
		}
		if (value.nodeName === "tr") {
			let building = this.handleTr(value);
			if (building != null) {
				buildings.push(building);
			} // do nothing if returned null
		}
		value.childNodes.forEach((child: any) => {
			this.traverseDocument(child).forEach((building, index, array) => {
				buildings.push(building);
			});
		});
		return buildings;
	}

	public static handleTr(value: any): Building | null {
		let fields: string[] = ["views-field views-field-field-building-code", "views-field views-field-title",
			"views-field-field-building-address", "views-field views-field-field-building-image",
			"views-field views-field-nothing"];
		let j = 0;
		value.childNodes.forEach((child: any) => {
			for (let i in fields) {
				if (child.nodeName === "td") {
					if (HTMLUtils.checkTdsValid(child.attrs, fields[i])) {
						j++;
					}
				}
			}
		});
		if (j === 5) { // contains all 5 wanted fields
			let fullname: string = "";
			let shortname: string = "";
			let address: string = "";
			let href: string = "";
			value.childNodes.forEach((child: any) => {
				if (child.nodeName === "td") {
					if (child.attrs.filter((x: any) =>
						x.value.includes("views-field views-field-field-building-code")).length > 0) {
						shortname = HTMLUtils.getLabel(child.childNodes, "#text");
					} else if (child.attrs.filter((x: any) =>
						x.value.includes("views-field views-field-title")).length > 0) {
						fullname = HTMLUtils.getLabelWrapA(child.childNodes);
					} else if (child.attrs.filter((x: any) =>
						x.value.includes("views-field views-field-field-building-address")).length > 0) {
						address = HTMLUtils.getLabel(child.childNodes, "#text");
					} else if (child.attrs.filter((x: any) =>
						x.value.includes("views-field views-field-nothing")).length > 0) {
						href = HTMLUtils.getHref(child.childNodes);
					}
				}
			});
			return new Building(fullname, shortname, address, href);
		} else { // not all five, return nothing for this <tr>
			return null;
		}
	}

	public static traverseDocumentBuilding(value: any): RoomData[] {
		let roomdatas: RoomData[] = [];
		if (!value || !value.childNodes) {
			return [];
		}
		if (value.nodeName === "tr") {
			let roomdata = this.handleTrBuilding(value);
			if (roomdata != null) {
				roomdatas.push(roomdata);
			} // do nothing if returned null
		}
		value.childNodes.forEach((child: any) => {
			this.traverseDocumentBuilding(child).forEach((roomdata, index, array) => {
				roomdatas.push(roomdata);
			});
		});
		return roomdatas;
	}

	public static handleTrBuilding(value: any): RoomData | null {
		let fields: string[] = ["views-field views-field-field-room-number",
			"views-field views-field-field-room-capacity", "views-field views-field-field-room-furniture",
			"views-field views-field-field-room-type", "views-field views-field-nothing"];
		let j = 0;
		value.childNodes.forEach((child: any) => {
			for (let i in fields) {
				if (child.nodeName === "td") {
					if (HTMLUtils.checkTdsValid(child.attrs, fields[i])) {
						j++;
					}
				}
			}
		});
		if (j === 5) { // contains all 5 wanted fields
			let number: string = "";
			let type: string = "";
			let furniture: string = "";
			let href: string = "";
			let seats: number = 0;
			value.childNodes.forEach((child: any) => {
				if (child.nodeName === "td") {
					if (child.attrs.filter((x: any) =>
						x.value.includes("views-field views-field-field-room-number")).length > 0) {
						number = HTMLUtils.getLabelWrapA(child.childNodes);
					} else if (child.attrs.filter((x: any) =>
						x.value.includes("views-field views-field-field-room-type")).length > 0) {
						type = HTMLUtils.getLabel(child.childNodes, "#text");
					} else if (child.attrs.filter((x: any) =>
						x.value.includes("views-field views-field-field-room-furniture")).length > 0) {
						furniture = HTMLUtils.getLabel(child.childNodes, "#text");
					} else if (child.attrs.filter((x: any) =>
						x.value.includes("views-field views-field-nothing")).length > 0) {
						href = HTMLUtils.getHref(child.childNodes);
					} else if (child.attrs.filter((x: any) =>
						x.value.includes("views-field views-field-field-room-capacity")).length > 0) {
						seats = parseInt(HTMLUtils.getLabel(child.childNodes, "#text"), 10);
					}
				}
			});
			return new RoomData(number, type, furniture, href, seats);
		} else { // not all five, return nothing for this <tr>
			return null;
		}
	}
}
