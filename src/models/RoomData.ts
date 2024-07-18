export default class RoomData {
	// sfield
	public readonly number: string;
	public readonly type: string;
	public readonly furniture: string;
	public readonly href: string;

	// mfields
	public readonly seats: number;

	constructor(number: string, type: string, furniture: string, href: string,  seats: number) {
		this.number = number;
		this.type = type;
		this.furniture = furniture;
		this.href = href;
		this.seats = seats;
	}
}
