import * as D3 from "d3";
import * as XLSX from "xlsx";

////////////////////////////
/* PARSING FUNCTION */
async function parse_xlsx(url_str, excl_row_n=0) {
	const file_xlsx = await fetch(url_str);
	const file_buffer = await file_xlsx.arrayBuffer();
	const file_read = XLSX.read(file_buffer);
	const file_sheet = file_read.Sheets[file_read.SheetNames[0]];

	if (excl_row_n > 0) {
		let range = XLSX.utils.decode_range(file_sheet['!ref']);
		range.s.r = excl_row_n;
		file_sheet['!ref'] = XLSX.utils.encode_range(range);
	}

	return XLSX.utils.sheet_to_json(file_sheet, {raw: false});
}
////////////////////////////


////////////////////////////
/* FORMAT FUNCTIONS */
function format_date(date_str, delimiter){
	if (date_str === undefined || date_str === "") {
		return "";
	} else {
		let date_prts = date_str.split(delimiter);
		//				YYYY		 / MM			   / DD
		date_prts = new Date(+date_prts[2], date_prts[1] - 1, +date_prts[0]);
		//return date_prts.getTime().toString(36);
		return date_prts.getTime();
		//return date_prts;
	}
}

function format_bool(type_str){
	if (type_str === undefined) {
		return false;
	} else {
		return true;
	}
}

function merge_date(data) {
	const noDateObjects = [];
	const mergedMap = new Map();
	
	for (const obj of data) {
		if (typeof obj !== "object") {
			noDateObjects.push(obj);
			continue;
		}
		
		const dateKey = obj["date"];
		
		if (mergedMap.has(dateKey)) {
			const existing = mergedMap.get(dateKey);
			
			for (const [key, value] of Object.entries(obj)) {
				if (key === 'date') continue;
				existing[key] = value;
			}
	  	}

		else {
			mergedMap.set(dateKey, {...obj});
		}
	}
  
	return [...noDateObjects, ...Array.from(mergedMap.values())];
}

function reduce_gender(gender_str) {
	if (gender_str === "Female" || gender_str === "female") {
		return "F";
	}

	if (gender_str === "Male" || gender_str === "male") {
		return "M";
	}
}
////////////////////////////


////////////////////////////
/* DATA IMPORT */

// FRS
let xlsx_url = "../_assets/APST_ALS Data Repository_Date file 4_ALSFRS-R data_V2.8_20250929_open.xlsx";
let ALSFRS_data = await parse_xlsx(xlsx_url);

ALSFRS_data = ALSFRS_data.map((d) => {
	return {
		id: d["Identifier"],
		date: format_date(d["Date of ALSFRS-R"], "/"),
		fsr_i1: Number(d["Item 1"]),
		fsr_i2: Number(d["Item 2"]),
		fsr_i3: Number(d["Item 3"]),
		fsr_i4: Number(d["Item 4"]),
		fsr_i5: Number(d["Item 5"]),
		fsr_i6: Number(d["Item 6"]),
		fsr_i7: Number(d["Item 7"]),
		fsr_i8: Number(d["Item 8"]),
		fsr_i9: Number(d["Item 9"]),
		fsr_i10: Number(d["Item 10"]),
		fsr_i11: Number(d["Item 11"]),
		fsr_i12: Number(d["Item 12"]),
		fsr_mean: D3.mean(
			[
				Number(d["Item 1"]),
				Number(d["Item 2"]),
				Number(d["Item 3"]),
				Number(d["Item 4"]),
				Number(d["Item 5"]),
				Number(d["Item 6"]),
				Number(d["Item 7"]),
				Number(d["Item 8"]),
				Number(d["Item 9"]),
				Number(d["Item 10"]),
				Number(d["Item 11"]),
				Number(d["Item 12"])
			]),
		sod: d["Source of data"]
	};
});

// Remove all objects with no date
for (let i = ALSFRS_data.length - 1; i >= 0; i--) {
	if (ALSFRS_data[i].date === "") {
		ALSFRS_data.splice(i, 1);
	}
}


// NfL
xlsx_url = "../_assets/APST_ALS Data Repository_Date file 5_Serum Neurofilament data_V2.4_20250929_open.xlsx";
let NfL_data = await parse_xlsx(xlsx_url);

NfL_data = NfL_data.map((d) => {
	return {
		id: d["Identifier"],
		date: format_date(d["Date of Sampling"], "."),
		nfl: Number(d["sNfL Value"])
	};
});

// Remove all objects with no date
for (let i = NfL_data.length - 1; i >= 0; i--) {
	if (NfL_data[i].date === "") {
		NfL_data.splice(i, 1);
	}
}


// OPM
xlsx_url = "../_assets/APST_ALS Data Repository_Date file 1_Demographic and diagnosis data_V2.7_20250929_open.xlsx";
let Demo_data = await parse_xlsx(xlsx_url, 1);

Demo_data = Demo_data.map((d) => {
	return {
		id: d["Identifier"],
		date: format_date(d["Date of symptom onset"], "/"),
		aao: Number(d["Age at onset (Years)"]),
		dod: format_date(d["Date of Death"], "/"),
		g: reduce_gender(d["Gender"])
	};
});


xlsx_url = "../_assets/APST_ALS Data Repository_Data file 2_Phenotype_V2.1.8_20241202_20250929_open.xlsx";
let Pheno_data = await parse_xlsx(xlsx_url, 1);

Pheno_data = Pheno_data.map((d) => {
	return {
		id: d["Identifier"],
		date: format_date(d["Visit date"], "."),
		opm_f1: format_bool(d["Dysarthria "]),
		opm_f2: format_bool(d["Dysphagia"]),
		opm_f3: format_bool(d["Arm paresis "]),
		opm_f4: format_bool(d["Leg paresis"]),
		opm_f5: format_bool(d["Hypoventilation"]),
		opm_t1: format_bool(d["Classical form of course "]),
		opm_t2: format_bool(d["Fail-leg syndrome "]),
		opm_t3: format_bool(d["Fail-arm syndrome "]),
		opm_t4: format_bool(d["Progressive bulbary paralysis "]),
		opm_t5: format_bool(d["Axial ALS "]),
		opm_t6: format_bool(d["Brachialotropic-paraspastic type "]),
		opm_s1: format_bool(d["Classical ALS"]),
		opm_s2: format_bool(d["Primary lateral sclerosis (PLS) "]),
		opm_s3: format_bool(d["Spastic ALS "]),
		opm_s4: format_bool(d["Progressive muscle atrophy (PMA)"])
	};
});

// Delete all OPM keys that are empty (false)
for (let i = 0; i < Pheno_data.length; i++) {
	for (const key in Pheno_data[i]) {
		if (Pheno_data[i][key] === false) {
			delete Pheno_data[i][key];
		}
	}
}


// MERGER
// Merging all data types
const merge = [
	...ALSFRS_data,
	...NfL_data,
	...Demo_data,
	...Pheno_data
];

// Group all data types bei ID
let merge_group = Object.groupBy(merge, ({ id }) => id);
merge_group = Object.entries(merge_group);
////////////////////////////


////////////////////////////
/* SORTING */

// Sort data set by ID
merge_group = merge_group.sort();

// Sort objects within IDs by date (old -> new)
for(let i = 0; i < merge_group.length; i++){
	merge_group[i] = merge_group[i].flat();
	merge_group[i].sort(
		(a, b) => D3.ascending(a.date, b.date)
	);

	for(let j = 1; j < merge_group[i].length; j++){
		delete merge_group[i][j]["id"];
	}

	merge_group[i] = merge_date(merge_group[i]);
}

// Sort all IDs by number of objects within (length) (long -> short)
merge_group.sort(
	(a, b) => D3.descending(a.length, b.length)
);

// Sort all IDs by first date recorded (oldest -> youngest)
//merge_group.sort((a, b) => a[1].date - b[1].date);


////////////////////////////
/* Count all items and identifiers */

let fsr_counter 		= 0;
let fsr_mean_counter 	= 0;
let opm_counter 		= 0;
let nfl_counter 		= 0;

for (let n = 0; n < merge_group.length; n++){
	for (let m = 1; m < merge_group[n].length; m++){
		for (const [key, value] of Object.entries(merge_group[n][m])) {
			if (key.includes("fsr_i"))		{fsr_counter++;}
			if (key.includes("fsr_mean")) 	{fsr_mean_counter++;}
			if (key.includes("opm")) 		{opm_counter++;}
			if (key.includes("nfl")) 		{nfl_counter++;}
		}
	}
}

// sum total number (minus fsr items)
const total_counter = fsr_mean_counter + opm_counter + nfl_counter

//console.log(merge_group);
console.log(total_counter);
////////////////////////////


////////////////////////////
/* STORE IN IDB */

// Create DB and define name.
// Leave out version number since there
// will be no iteration.
const request = indexedDB.open("APST_DATA");
let db = null;

// Adding events to the request object
request.onupgradeneeded = () => {
    // Targeting request and get the result,
    // the result is the DB
    db = request.result;
    const dataArray = db.createObjectStore("merge_group");
    console.log("IDB updated.");
}

request.onsuccess = () => {
    db = request.result;
    console.log("IDB success.");

    const tx = db.transaction("merge_group", "readwrite");
    const tx_dataArray = tx.objectStore("merge_group");
    tx_dataArray.put(merge_group, "DATA");
    tx_dataArray.put(total_counter, "N_TOTAL");
	tx_dataArray.put(fsr_mean_counter, "N_FSR_MEAN");
	tx_dataArray.put(fsr_counter, "N_FSR");
	tx_dataArray.put(opm_counter, "N_OPM");
	tx_dataArray.put(nfl_counter, "N_NFL");

    tx.oncomplete = () => {
        console.log("IDB transaction success.");
        db.close();
    };
}

request.onerror = () => {
    console.log("IDB error.");
}