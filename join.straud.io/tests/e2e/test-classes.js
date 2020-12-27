class Test {

	constructor() {
		this.init.bind(this);
		this.run.bind(this);
		this.teardown.bind(this);
	}

	init() {
		// implement me
	}

	run() {
		// implement me
	}

	teardown(success) {
		// implement me
	}
}

class TestSection {
	getTests() {
		let testList = [];

		for (let key of Object.keys(this)) {
			if (key.startsWith('Test_')) {
				testList.push(this[key]);
			}
		}

		return testList;
	}
}

class TestRunner {

	constructor() {
		this.testSectionClasses = [];

		this.addTestSection = this.addTestSection.bind(this);
		this.run = this.run.bind(this);
	}

	addTestSection(TestSectionClass) {
		this.testSectionClasses.push(TestSectionClass);
	}

	async run() {
		for (let section of this.testSectionClasses) {
			await this.runSection(section);
		}
	}

	async runSection(TestSectionClass) {
				let testCount = 0;
				let failureCount = 0;
				let successCount = 0;
				
				let testSection = new TestSectionClass();
				let tests = testSection.getTests();

				console.log(`RUNNING TEST SECTION[${testSection.constructor.name}]`);

				for (let test of tests) {
					let t = new test();
					let success = await t.init();

					if (success) {
						console.log(`SUCCESS ${t.constructor.name}`);
						successCount++;
					} else {
						console.error(`FAILURE ${t.constructor.name}`)
						failureCount++;
					}
					testCount++;
				}

				console.log(`Ran ${testCount} tests`);
				console.log(`Success count: ${successCount}`);
				console.log(`Failure count: ${failureCount}`);

				console.log(`TEST SECTION[${testSection.constructor.name}] COMPLETE`);
	}
}

module.exports = {
	Test: Test,
	TestSection: TestSection,
	TestRunner: TestRunner
}