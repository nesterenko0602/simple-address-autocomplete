/**
 * Async AutoComplete - 1.0.0
 * (c) 2016 Dmitriy Nesterenko
 *
 */

;(function () {
	
	// Controller
	let default_options = {
		light_tips: [],
		heavy_tips: [],
		tips: [],
		tip: {},
		heavy_query_delay: 3000,
		selector: '',
		lightQueryUrl: '',
		heavyQueryUrl: '',
		minChars: 1,
		preProcess: function(results, query) {
			return results;
		},
		tipTemplate: function(tip){
			return '<div>' + tip.text + '</div>';
		},
		onChange: function(result) {},
	}

	function Controller(params, view) {
		[this.options, this.view] = [{}, view];
		Object.assign(this.options, default_options, params);
	}

	Controller.prototype.get = function(field) {
		return this.options[field];
	}

	Controller.prototype.set = function(field, value) {
		if (this.options[field] === undefined) {
			this.options[field] = '';
		}
		if (~['heavy_tips', 'light_tips'].indexOf(field)) {
			let tipsDOM = this.view._tipsDOM;

			let newTipsDOM = document.createDocumentFragment('div');			
			for (let row of value) {
				// let tipDOM = document.createElement('div');

				let tmp_string = this.options.tipTemplate(row);
				let tipDOM = document.createElement('div');
				tipDOM.innerHTML = tmp_string;
				tipDOM = tipDOM.childNodes[0];

				tipDOM.setAttribute('data-tip-id', row.autocomplete_id);	
				tipDOM.classList.add('async-complete__list-item');
				
				tipDOM.addEventListener('mousedown', event => {
					this.selectTip(event.currentTarget);
					event.preventDefault();
					event.stopPropagation();
				});

				// let fragment = document.createDocumentFragment('div');
				// fragment.innerHTML = tipDOM;

				newTipsDOM.appendChild(tipDOM);
			}
			
			field === 'light_tips' && (tipsDOM.innerHTML = '');

			tipsDOM.appendChild(newTipsDOM);
		} else if (field == 'tip') {
			
		}
		return this.options[field] = value;
	}

	Controller.prototype.selectTip = function(current) {
		var selected_element;

		if (typeof current == 'string') {
			selected_element = current;
		} else {
			selected_element = this.get('tips').find(elem => {
				return elem.autocomplete_id == current.getAttribute('data-tip-id');
			}) || {};
		}
		
		this.view._tipsDOM.classList.remove('active');
		this.view._tipsDOM.innerHTML = '';
		this.view._inputDOM.value = '';
		this.view._inputDOM.blur();

		this.get('onChange')(selected_element);
	}

	Controller.prototype._keydownCallback = function(event) {
		event.preventDefault();
		
		this._input_value = event.currentTarget.value;
		if (event.currentTarget.value.length < this.get('minChars')) {
			this.view._tipsDOM.innerHTML = '';
			return;
		}
		let tipsList = this.view['_tipsDOM'];

		if (event.keyCode === 13) { //ENTER
			if (!tipsList) {
				return;
			}
			let current = tipsList.querySelector('.active');
			if (!current) {
				current = event.currentTarget.value;
			}
			this.selectTip(current);
		} else if (~[38,40].indexOf(event.keyCode)) { //UP & DOWN
			// Unselect hovered
			tipsList.parentElement.classList.add('async-complete__list-wrapper--nohover');

			let current = tipsList.querySelector('.active');
			if (!current) {
				current = tipsList.querySelector(':hover');
			}

			if (current) {
				current.classList.remove('active');
				let next = (event.keyCode === 40) && (current.nextSibling || tipsList.childNodes[0]) || (current.previousSibling || tipsList.childNodes[tipsList.childNodes.length-1]);
				next.classList.add('active');
			} else {
				tipsList.childNodes[0] && tipsList.childNodes[0].classList.add('active');
			}
		} else {
			try { this._light_xhr.abort(); } catch(e) {}
			try { this._heavy_xhr.abort(); } catch(e) {}
			try { clearTimeout(this._heavy_query_timer); } catch(e) {}
	        let urls = {
	        	'heavy': this.get('heavyQueryUrl') + '&query='+event.currentTarget.value,
	        	'light': this.get('lightQueryUrl') + '&query='+event.currentTarget.value
	        }
	        this._light_xhr = fetch(urls['light'])
	        	.then(data => { 
	        		return data.json();
		       	})
		       	.then((function(result) {
		       		result = this.options.preProcess(result, this._input_value);
		       		this.set('light_tips', result);
		       		this.set('tips', result);
		       	}).bind(this));

		    this._heavy_query_timer = setTimeout(() => {
		        this._heavy_xhr = fetch(urls['heavy'])
	        	.then(data => { 
	        		return data.json();
		       	})
		       	.then((function(result) {
		       		result = this.options.preProcess(result, this._input_value);
		       		this.set('heavy_tips', result);
		       		let light_tips = this.get('light_tips', result);
		       		this.set('tips', light_tips.concat(result));
		       	}).bind(this));
		    }, this.get('heavy_query_delay'));
		}
	}


	// View
	function AsyncAutoComplete(params) {
		this.controller = new Controller(params, this);
		this._drawElems();
	}
	
	AsyncAutoComplete.prototype._drawElems = function() {
		this.$el = document.querySelector(this.controller.get('selector'));
		if (!(~['DIV'].indexOf(this.$el.tagName))){
			throw 'Инициализировать компонент можно только в DIV';
		}
		this.$el.classList.add('async-complete');
		
		//street block
		let streetDOM = CreateElement('div', 'async-complete__block', null, this.$el);
		this._blockDOM = streetDOM;
		this._inputDOM = CreateElement('input', 'async-complete__input', [{
			type: 'keyup',
			callback: event => {
				this.controller._keydownCallback(event)
			}
		}, {
			type: 'focus',
			callback: event => {
				this._tipsDOM.classList.add('active');
			}
		}, {
			type: 'blur',
			callback: event => {
				this._tipsDOM.classList.remove('active');
			}
		}], streetDOM );
		this._tipsDOM = CreateElement('div', 'async-complete__list-wrapper', [{
			type: 'mousemove',
			callback: event => {
				event.currentTarget.parentNode.querySelector('.async-complete__list-wrapper').classList.remove('async-complete__list-wrapper--nohover');
				event.currentTarget.parentNode.querySelectorAll('.async-complete__list-item.active').forEach(node => {
					node.classList.remove('active');
				})
			}
		}], streetDOM);
	}

	function CreateElement(type, classes, events, parent) {
		let DOM = document.createElement(type);
		classes && DOM.setAttribute('class', classes);
		if (events) {
			for(let event of events) {
				DOM.addEventListener(event.type, event.callback);
			}
		}
		parent && parent.appendChild(DOM);
		return DOM;
	}

	window.AsyncAutoComplete = AsyncAutoComplete;
	return AsyncAutoComplete;
}());
