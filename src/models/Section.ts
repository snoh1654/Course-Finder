export default class Section {
	// mfields
	public readonly avg: number;
	public readonly pass: number;
	public readonly fail: number;
	public readonly audit: number;
	public readonly year: number;

	// sfields
	public readonly dept: string;
	public readonly id: string;
	public readonly instructor: string;
	public readonly title: string;
	public readonly uuid: string;

	constructor(avg: number, pass: number, fail: number, audit: number, year: number,
		dept: string, id: string, instructor: string, title: string, uuid: string) {
		this.avg = avg;
		this.pass = pass;
		this.fail = fail;
		this.audit = audit;
		this.year = year;
		this.dept = dept;
		this.id = id;
		this.instructor = instructor;
		this.title = title;
		this.uuid = uuid;
	}
}
