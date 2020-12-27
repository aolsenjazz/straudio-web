import { saveAs } from 'file-saver';

class PcmDownloader {

	constructor(fileUri) {
		this._fileUri = fileUri;
		this.data = new Float32Array(0);

		this.feed = this.feed.bind(this);

		this.save = this.save.bind(this);
	}

	feed(data) {
		let tmp = new Float32Array(this.data.length + data.length);
		tmp.set(this.data, 0);
		tmp.set(data, this.data.length);
		this.data = tmp;
	}

	save() {
		let blob = new Blob([this.data], {type: "application/octet-stream"});
		saveAs(blob, this._fileUri);
	}

}

export default PcmDownloader;