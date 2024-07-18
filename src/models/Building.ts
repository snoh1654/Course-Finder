export default class Building {
	// sfield
	public readonly fullname: string;
	public readonly shortname: string;
	public readonly address: string;
	public readonly href: string;

	constructor(fullname: string, shortname: string, address: string, href: string) {
		this.fullname = fullname;
		this.shortname = shortname;
		this.address = address;
		this.href = href;
	}

	public getAddress() {
		return this.address;
	}
}
