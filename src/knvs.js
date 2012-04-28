/*
name: kanvas

author: Germán David Avellaneda Ballén (@Davsket) & contributors

description: A canvas animation library.

license: 

Copyright 2011 Germán David Avellaneda Ballén and Monoku


Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/


var Knvs = new function () {

	/*
	 * This is the private constructor
	 */
	var Knvs_ = function (element, options) {
		
		options = options || {};
		
		/*
		 * Public properties
		 */
		this.element_ = element;
		
		/*
		 * Private properties
		 */
		var 
			elements_ = [], 
			fr_ = options.fr || 30, 
			ctx_ = this.element_.getContext('2d'), 
			Figure, linear
		; 
		
		/*
		 * Setup
		 */
		ctx_.strokeStyle = "rgba(255, 255, 255, 1)"; 
		ctx_.fillStyle = "rgba(255, 255, 255, 1)";
		ctx_.beginPath();

		linear = function (val){return val;};


		Figure = function (param, knvsi){
			//The knvs instance
			this.knvsi = knvsi;
			param = param || {};
			this.left = param.left || 0;
			this.top = param.top || 0;
			this.animation = null;
			this.scalex = param.scalex || 1;
			this.scaley = param.scaley || 1;
			this.angle = param.angle || 0;
			this.angle_origin_x = param.angle_origin_x || 0;
			this.angle_origin_y = param.angle_origin_y || 0;
			this.alpha = param.alpha || 1;
			
			this.draw = function (){};

			this.getType = function (){
				return 'base';
			};

			this.morph = function (attributes, options){
				if(this.animation){
					this.animation.cancel();
				}
				this.animation = new this.knvsi.morph_(this, attributes, options, this.knvsi);
				this.animation.start();

				return this.animation;
			};
			
			this.scale = function (x,y){
				this.scalex = x;
				this.scaley = y;
			};

			this.set = function(properties){
				for(property in properties){
					this[property] = properties[property];
				}
			}
		};

		this.circle = function (param){
			var figure = new Figure(param, this);
			figure.color = param.color;
			figure.radius = param.radius;

			figure.draw = function (){
				ctx_.beginPath(); 
				ctx_.save();
			    ctx_.fillStyle = this.color;
				ctx_.translate(this.left+this.angle_origin_x, this.top+this.angle_origin_y);  
				ctx_.rotate(this.angle * Math.PI/180);
			    ctx_.moveTo(-this.angle_origin_x, -this.angle_origin_y); 
			    ctx_.scale(this.scalex,this.scaley);
				ctx_.arc(-this.angle_origin_x, -this.angle_origin_y, this.radius, 0, (param.angle || Math.PI) * 2, true);
				ctx_.fill();
				ctx_.restore();
				return this;
			};

			figure.getType = function (){
				return 'circle';
			};
			
			return figure;
		};

		this.rect = function (param){
			var figure = new Figure(param, this);
			figure.color = param.color;
			figure.width = param.width || 1;
			figure.height = param.height || 1;

			figure.draw =  function (){
				ctx_.beginPath(); 
				ctx_.save();
			    ctx_.fillStyle = this.color;
				ctx_.translate(this.left + this.angle_origin_x, this.top + this.angle_origin_y);  
				ctx_.rotate(this.angle * Math.PI/180);
			    ctx_.moveTo(-this.angle_origin_x, -this.angle_origin_y); 
			    ctx_.scale(this.scalex,this.scaley);
				ctx_.fillRect (-this.angle_origin_x, -this.angle_origin_y, this.width, this.height);
				ctx_.restore();
				return this;
			};

			figure.getType = function (){
				return 'rectangle';
			};
			return figure;
		};

		this.image = function (param){
			var figure = new Figure(param, this);
			figure._loaded = false;
			figure.img = new Image();
			figure.draw = (function (that){
				return function (){
					if(this._loaded){
						var prevAlpha = ctx_.globalAlpha;
						ctx_.save();
						ctx_.translate(this.left + this.angle_origin_x * this.scalex, this.top + this.angle_origin_y * this.scaley);  
						ctx_.rotate(this.angle * Math.PI/180); 
						ctx_.globalAlpha = this.alpha;
					    ctx_.scale(this.scalex,this.scaley);
						try{
							this.width=this.width<=0?this.img.width:this.width;
							this.height=this.height<=0?this.img.height:this.height;
							ctx_.drawImage(this.img, -this.angle_origin_x, -this.angle_origin_y,  this.width, this.height);
						}catch(e){
						}
						ctx_.restore();
					}
					else{
						this._must_draw = true;
					}
				};
			}(this));


			figure.img.onload = (function (self){
				return function (){
					self._loaded = true;
					if(self._must_draw){
						self.draw();
					}
				};
			}(figure));
			
			figure.img.src = figure.src = param.src;
			figure.width = param.width !== 0 && !param.width ? figure.img.width : param.width;
			figure.height = param.height !== 0 && !param.height ? figure.img.height : param.height;

			figure.getType = function (){
				return 'image';
			};
			return figure;
		};

		this.text = function (param){
			var figure = new Figure(param, this);
			figure.text = param.text;
			figure.font = param.font;

			figure.draw = (function (that){
				return function (){
					var prevAlpha = ctx_.globalAlpha;
					ctx_.save();
					ctx_.translate(this.left+this.angle_origin_x, this.top+this.angle_origin_y);  
					ctx_.rotate(this.angle * Math.PI/180);
					ctx_.globalAlpha = this.alpha;
				    ctx_.font = this.font;
				    ctx_.fillText(this.text, 0, 0, 200);
					ctx_.restore();
					return this;
				};
			}(this));
			figure.getType = function (){
				return 'text';
			};
			return figure;
		};


		/*
		 * This is the public draw method
		 * @param type can be: circle, image, rect, text
		 * @param param are the specialized properties for 
		 * the object to be draw
		 */
		this.draw = function (type, param){
			var graph = this[type](param);
			if( param.zIndex===0 || param.zIndex>0){
				elements_.splice(param.zIndex,0,graph);
			}else{			
				elements_.push(graph);
			}
			graph.draw();
			return graph;
		};


		this._draw = function (){
			var i;
			this.clear();
			for (i = 0 ; i < elements_.length ; i += 1) {
				elements_[i].draw();
			}
		};

		this.clear = function (){
			var width = this.element_.width, height = this.element_.height;
			ctx_.clearRect(0,0, width, height);
		};

		this.remove = function (figure){
			var i;
			for (i = 0; i < elements_.length; i += 1) {
				if(elements_[i]===figure){
					return elements_.splice(i,1);
				}
			}
			return null;
		};


		/*
		 * This section contains all the timing controlling
		 * One timer for all the animations.
		 */


		/*
		 * This is the singleton method for the timer
		 */
		this.getTimer = function (){
			if(!this.timer){
				this.timer = new this._Timer(this);
			}
			return this.timer;
		};

		/*
		 * This is the private class _Timer asociated to this
		 * canvas
		 */
		this._Timer = function (_canvas_){
			//Always there's gonna be the draw canvas method
			this._intervals = [];
			this.interval = undefined;
			this.frame = 0;
			this._canvas_ = _canvas_;

			this.addInterval = function (anim, duration){
				var that = this;
				this._intervals.push(new this._canvas_.Interval(anim, duration));
				if(!this.interval){
					window.requestAnimFrame = (function(){
				      return  window.requestAnimationFrame       || 
				              window.webkitRequestAnimationFrame || 
				              window.mozRequestAnimationFrame    || 
				              window.oRequestAnimationFrame      || 
				              window.msRequestAnimationFrame     || 
				              function( callback ){
				                window.setTimeout(this.iterate(this), this._canvas_.fr);
				              };
				    })();
					// this.interval = setInterval(this.iterate(this), this._canvas_.fr);
					(function animloop(){
						requestAnimFrame(animloop);
						that.iterate(that)();
				    })();
				}
			};

			this.removeInterval = function (anim){
				var i, leinterval;
				for (i = 0; i < this._intervals.length; i += 1) {
					leinterval = this._intervals[i];
					if(leinterval.anim === anim){
						this._intervals.splice(i, 1);
					}
				}
				if(this._intervals.length === 0){
					clearInterval(anim.interval);
					anim.interval = undefined;
				}
			};

			this.iterate = function (that){
				return function (){	
					var time, completed, i, interval, delta;		
					time = (new Date()).getTime();
					completed = [];
					that.frame = that.frame+1;

					for (i=0; i<that._intervals.length; i += 1) {
						interval = that._intervals[i];
						delta = time > interval.end ? 1 : (time - interval.start) / interval.duration;
						if(that._intervals.length === 0){
							clearInterval(that.interval);
							that.interval = undefined;
						}
						if(delta === 1){
							completed.push(that._intervals.splice(i, 1)[0]);
							
						}
						interval.anim.callback(delta);
					}

					that._canvas_._draw();

					for (i=0; i < completed.length; i += 1) {
						interval = completed[i];
						interval.anim.after_callback(interval.anim.element);
					}
				};
			};
		};

		/*
		 * This class instantiates an iteration
		 * for animation
		 */
		this.Interval = function (anim, duration){
			this.start = (new Date()).getTime();
			this.end = this.start+duration; //duration in ms
			this.duration = duration;
			this.anim = anim;
		};

		/**
		 * Inspired in Scripty2
		 * @param element is the element to be morphed
		 * @param attributes is an object with the properties to be morphed to
		 * @options is an obj with the animation preferences:
		 * { duration: 2000, transition: easingFunction, transitions: {height: easingFunction}, after: function (){} }
		 * you can use the Easing Equations of Robert Penner
		 */
		this.morph_ = function (element, attributes, options, knvsi){
			var property, timer, i;
			this.knvs = knvsi;
			timer = this.knvs.getTimer();
			this.init = {};
			options = options || {};

			this.element = element;
			this.attributes = attributes;
			// if no transition, then linear
			this.transition = options.transition || linear; 
			this.transitions = options.transitions || {};
			this.after_callback = options.after || function (){};
			this.duration = options.duration || 300;

			if(attributes.zIndex === 0 || attributes.zIndex > 0){
				for(i=0; i<elements_.length; i += 1){
					if(elements_[i] === element){
						elements_.splice(i, 1);
					}
				}
				elements_.splice(attributes.zIndex, 0, element);
			}
			
			this.callback = function (delta){
				var newDelta, inicolor, destinycolor, elementcolor, i;
				if(delta<0){
					delta=0;
				}
				for (property in this.attributes) {
					var value = this.element[property];
					//if some transition is going to be applied then...
					newDelta = this.transitions[property] ? this.transitions[property](delta) : this.transition(delta);
					//if is a color attribute
					if(typeof(value) == "string" && /^(rgb|#)/.test(value)){
						if(/^#([\d|a-f]{3}){1,2}$/i.test(value)){
							value = hexToRGBA(value);
						}
						if(/^#/.test(this.attributes[property])){
							this.attributes[property] = hexToRGBA(this.attributes[property]);
							this.init[property] = value;
						}
						inicolor = this.init[property].match(/\d+(\.\d+)?/g);
						destinycolor = this.attributes[property].match(/\d+(\.\d+)?/g);
						elementcolor = value.match(/\d+(\.\d+)?/g);
						inicolor = inicolor.length<3?inicolor.concat([1]):inicolor;
						destinycolor = destinycolor.length<3?destinycolor.concat([1]):destinycolor;
						elementcolor = elementcolor.length<3?elementcolor.concat([1]):elementcolor;
						for(i=0;i<4;i+=1){
							if(i<3){			
								elementcolor[i] = parseInt(parseInt(inicolor[i])+ (parseInt(destinycolor[i]) - parseInt(inicolor[i])) * newDelta);
							}
							else{
								elementcolor[i] = parseFloat(parseFloat(inicolor[i])+ (parseFloat(destinycolor[i]) - parseFloat(inicolor[i])) * newDelta);
							}
						}
						this.element[property]="rgba("+elementcolor.join(",")+")";
					}
					else{				
						this.element[property] = this.init[property] + (this.attributes[property] - this.init[property]) * newDelta;
					}
				}
			};

			this.start = function (){	
				for (property in attributes) {
					this.init[property] = element[property] || 0;
				}
				var timer = this.knvs.getTimer();
				timer.addInterval(this, this.duration);
			};

			this.cancel = function (){	
				var timer = this.knvs.getTimer();
				timer.removeInterval(this);
			};

			/**
			 *	"Appends" a new function to the older
			 */
			this.after = function(new_function){
				var prev_function = this.after_callback;
				this.after_callback = (function(self, prev_func, new_func){
					return function(){
						prev_func(self);
						new_func(self);
					};
				}(this.element, prev_function, new_function));
				
				return this;
			};

			/**
			 *	Create a new after callback with a new morph object, and returns this.
			 */
			this.morph = function(attributes, options){
				var new_morph = new this.knvs.morph_(this.element, attributes, options, this.knvs);
				this.after(function(element){
					new_morph.start();
				});
				return new_morph;
			}

		}

		function hexToRGBA(color){
			if(color.length == 4){
				var color2 = '#', a;
				for(var i=1; i<color.length;i++){
					color2 += ((a = color.substr(i,1))+a);
				}
				color = color2;
			}
			return 'rgba('+parseInt(color.substr(1,2),16)+','+parseInt(color.substr(3,2),16)+','+parseInt(color.substr(5,2),16)+',1)'
		}

	};


	/*
	 * @param element the DOM element or id
	 * @param options object with extra configurations
	 *	-fr the frame rate
	 * return the knvs object or null if the param is invalid
	 */
	this.create = function (element, options) {
		if(typeof element == 'string'){
			element = document.getElementById(element);
		}
		if(typeof element == 'object' && element.tagName == 'CANVAS'){
			return new Knvs_(element, options);
		}
		return null;
	};
};