const fs = require('fs');

/**

Compares two PCM files. Configured to ready two stereo interleave, little-endian, float32 files (-1.0 < sample < 1)

*/

let gt_name = process.env.GROUND_TRUTH;
let tf_name = process.env.TEST_FILE;

if (!gt_name) {
	console.error('set GROUND_TRUTH env variable first');
	process.exit();
}

if (!tf_name) {
	console.error('set TEST_FILE env variable first');
	process.exit();
}

// load files

console.log('Reading files...');

let gt_data = fs.readFileSync(gt_name, null);
let tf_data = fs.readFileSync(tf_name, null);



// let gt_array = new Float32Array(gt_data.buffer, 0, gt_data.byteLength / Float32Array.BYTES_PER_ELEMENT);
// let tf_array = new Float32Array(tf_data.buffer, 0, tf_data.byteLength / Float32Array.BYTES_PER_ELEMENT);

console.log(`Locating first-non zero in ground truth`);

// find the first non-zero in the ground truth version
let first_non_zero_in_gt;
let first_non_zero_in_gt_idx;
let idx = 0;
for (i = 0; i < gt_data.length; i++) {
	if (gt_data[i] != 0) {
		first_non_zero_in_gt_idx = i;
		first_non_zero_in_gt = gt_data[i];

		break;
	}
}

console.log(`First non-zero [${first_non_zero_in_gt}] located at index [${first_non_zero_in_gt_idx}]`);

console.log('Searching for matching value in test data...')

// find the first occurence of the above non-zero in the test array. it should only be preceded by 0's
let current_val;
let matching_tf_idx;
for (i = 0; i < tf_data.length; i++) {
	current_val = tf_data[i];
	if (current_val == first_non_zero_in_gt) {
		matching_tf_idx = i;
		break;
	} else if (current_val == 0) {
		// that's fine. there will probably be 0's preceding the first non-zero val
	} else {
		// console.log(`Encountered non-matching, non-zero value [${current_val}] at sample index [${i}]`);
		// process.exit();
	}
}

console.log(`First non-zero value [${first_non_zero_in_gt}] matches at index [${matching_tf_idx}]`);
// console.log(`Comparing...`);

for (i = 0; i < 100; i++) {

	console.log(`GT: [${gt_data[i+first_non_zero_in_gt_idx]}] || TF: [${tf_data[i+matching_tf_idx]}]`);

}



