const {Test, TestSection, TestRunner} = require('./test-classes');
const DatabaseTests = require('./db-tests');
const SignalTests = require('./signal-tests');

let runner = new TestRunner();
runner.addTestSection(SignalTests);
runner.addTestSection(DatabaseTests);
runner.run();
