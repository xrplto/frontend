class MedianFilter {
	constructor(size = 7) {
		this.values = [];
		this.size = size;
		this.middleIndex = Math.floor(size / 2);
	}

	input(val) {
		// If it's empty, fill it up
		if (this.values.length === 0) {
			this.fill(val);
			return val;
		}

		// Remove oldest value and add new value
		this.values.shift();
		this.values.push(val);

		// Use a more efficient sorting algorithm
		const sorted = this.quickSelect(this.values.slice(), this.middleIndex);
		
		// Return median value
		return sorted[this.middleIndex];
	}

	fill(val) {
		this.values = new Array(this.size).fill(val);
	}

	// Implement QuickSelect algorithm for finding the median
	quickSelect(arr, k) {
		const partition = (low, high) => {
			const pivot = arr[high];
			let i = low - 1;

			for (let j = low; j < high; j++) {
				if (arr[j] <= pivot) {
					i++;
					[arr[i], arr[j]] = [arr[j], arr[i]];
				}
			}

			[arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
			return i + 1;
		};

		const select = (low, high) => {
			if (low === high) return;

			const pivotIndex = partition(low, high);

			if (k === pivotIndex) return;
			else if (k < pivotIndex) select(low, pivotIndex - 1);
			else select(pivotIndex + 1, high);
		};

		select(0, arr.length - 1);
		return arr;
	}
}

// Usage
const touchFix = new MedianFilter(10);
const val = touchFix.input(touches);