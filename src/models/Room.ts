export default class Room {
	// sfield
	public readonly fullname: string;
	public readonly shortname: string;
	public readonly number: string;
	public readonly name: string;
	public readonly address: string;
	public readonly type: string;
	public readonly furniture: string;
	public readonly href: string;

	// mfields
	public readonly lat: number;
	public readonly lon: number;
	public readonly seats: number;

	constructor(fullname: string, shortname: string, number: string, name: string, address: string,
		type: string, furniture: string, href: string, lat: number, lon: number, seats: number) {
		this.fullname = fullname;
		this.shortname = shortname;
		this.number = number;
		this.name = name;
		this.address = address;
		this.type = type;
		this.furniture = furniture;
		this.href = href;
		this.lat = lat;
		this.lon = lon;
		this.seats = seats;
	}
}
