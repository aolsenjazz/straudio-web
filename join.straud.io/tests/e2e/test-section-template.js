const {Test, TestSection, TestRunner} = require('./test-classes');

class TitleOfTestSection extends TestSection {

	// Every test must start with Test_ to be detected by the test runner
	Test_SomeMethod_Result_Condition = class extends Test {

		init() {
			return new Promise((resolve, reject) => {
				// do some construction

				this.run();	
				this.resolve = resolve;
			});
		}

		run() {
			// test something, then call teardown(success)
		}

		teardown(success) {
			// tear stuff down

			this.resolve(success);
		}
	}
}

if (require.main === module) {
	let runner = new TestRunner();
	runner.addTestSection(TitleOfTestSection);
	runner.run();
}

module.exports = TitleOfTestSection;