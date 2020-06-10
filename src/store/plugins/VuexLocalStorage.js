
import debounce from "lodash/debounce"

let localStorageAvailable = () => {
    let test = 'test';
    try {
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch(e) {
        return false;
    }
}


let debouncedUpdate = debounce((state) => {
	localStorage.setItem('app', JSON.stringify(state));
}, 200)

let setupLocalStorage = (store) => {
	let previous = localStorage.getItem('app');

	if(previous){
		store.replaceState(JSON.parse(previous));
	}
}

const VuexLocalStorage = (store) => {

	if( ! localStorageAvailable() ){
		return false;
	}

	setupLocalStorage(store);

    store.subscribe((mutation, state) => {
        debouncedUpdate(state);
    })

}

export default VuexLocalStorage;
