import App from './App.svelte';

class PIXXIO {
	constructor(config = {}, lang = 'en') {
		this.boot();
		this.config = config;
		this.app = new App({
			target: document.querySelector('#pixxio-integration'),
			props: {
				standalone: true,
				config
			}
		});
	}
	boot() {
		const root = document.createElement('div');
		root.id = 'pixxio-integration';
		document.body.appendChild(root);
	};
	getMedia(config) {		
		return new Promise((resolve, reject) => {
			if(config.max) {
				this.app.$set({ max: config.max });
			}
			this.app.$set({ show: true });
			this.app.$on('submit', (event) => {
				this.app.$set({ show: false });
				resolve(event.detail);
			})
			this.app.$on('cancel', () => {
				this.app.$set({ show: false });
				reject();
			})
		}) 
	}
}

window.PIXXIO = PIXXIO

export default PIXXIO;