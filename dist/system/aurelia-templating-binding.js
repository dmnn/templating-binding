System.register(['aurelia-logging', 'aurelia-binding', 'aurelia-templating'], function (_export) {
  'use strict';

  var LogManager, Parser, ObserverLocator, EventManager, ListenerExpression, BindingExpression, NameExpression, CallExpression, bindingMode, BehaviorInstruction, BindingLanguage, SyntaxInterpreter, info, logger, TemplatingBindingLanguage, InterpolationBindingExpression, InterpolationBinding;

  _export('configure', configure);

  function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  function configure(config) {
    var instance,
        getInstance = function getInstance(c) {
      return instance || (instance = c.invoke(TemplatingBindingLanguage));
    };

    if (config.container.hasHandler(TemplatingBindingLanguage)) {
      instance = config.container.get(TemplatingBindingLanguage);
    } else {
      config.container.registerHandler(TemplatingBindingLanguage, getInstance);
    }

    config.container.registerHandler(BindingLanguage, getInstance);
  }

  return {
    setters: [function (_aureliaLogging) {
      LogManager = _aureliaLogging;
    }, function (_aureliaBinding) {
      Parser = _aureliaBinding.Parser;
      ObserverLocator = _aureliaBinding.ObserverLocator;
      EventManager = _aureliaBinding.EventManager;
      ListenerExpression = _aureliaBinding.ListenerExpression;
      BindingExpression = _aureliaBinding.BindingExpression;
      NameExpression = _aureliaBinding.NameExpression;
      CallExpression = _aureliaBinding.CallExpression;
      bindingMode = _aureliaBinding.bindingMode;
    }, function (_aureliaTemplating) {
      BehaviorInstruction = _aureliaTemplating.BehaviorInstruction;
      BindingLanguage = _aureliaTemplating.BindingLanguage;
    }],
    execute: function () {
      SyntaxInterpreter = (function () {
        SyntaxInterpreter.inject = function inject() {
          return [Parser, ObserverLocator, EventManager];
        };

        function SyntaxInterpreter(parser, observerLocator, eventManager) {
          _classCallCheck(this, SyntaxInterpreter);

          this.parser = parser;
          this.observerLocator = observerLocator;
          this.eventManager = eventManager;
        }

        SyntaxInterpreter.prototype.interpret = function interpret(resources, element, info, existingInstruction) {
          if (info.command in this) {
            return this[info.command](resources, element, info, existingInstruction);
          }

          return this.handleUnknownCommand(resources, element, info, existingInstruction);
        };

        SyntaxInterpreter.prototype.handleUnknownCommand = function handleUnknownCommand(resources, element, info, existingInstruction) {
          var attrName = info.attrName,
              command = info.command;

          var instruction = this.options(resources, element, info, existingInstruction);

          instruction.alteredAttr = true;
          instruction.attrName = 'global-behavior';
          instruction.attributes.aureliaAttrName = attrName;
          instruction.attributes.aureliaCommand = command;

          return instruction;
        };

        SyntaxInterpreter.prototype.determineDefaultBindingMode = function determineDefaultBindingMode(element, attrName) {
          var tagName = element.tagName.toLowerCase();

          if (tagName === 'input') {
            return attrName === 'value' || attrName === 'checked' || attrName === 'files' ? bindingMode.twoWay : bindingMode.oneWay;
          } else if (tagName == 'textarea' || tagName == 'select') {
            return attrName == 'value' ? bindingMode.twoWay : bindingMode.oneWay;
          } else if (attrName === 'textcontent' || attrName === 'innerhtml') {
            return element.contentEditable === 'true' ? bindingMode.twoWay : bindingMode.oneWay;
          } else if (attrName === 'scrolltop' || attrName === 'scrollleft') {
            return bindingMode.twoWay;
          }

          return bindingMode.oneWay;
        };

        SyntaxInterpreter.prototype.bind = function bind(resources, element, info, existingInstruction) {
          var instruction = existingInstruction || BehaviorInstruction.attribute(info.attrName);

          instruction.attributes[info.attrName] = new BindingExpression(this.observerLocator, this.attributeMap[info.attrName] || info.attrName, this.parser.parse(info.attrValue), info.defaultBindingMode || this.determineDefaultBindingMode(element, info.attrName), resources.valueConverterLookupFunction);

          return instruction;
        };

        SyntaxInterpreter.prototype.trigger = function trigger(resources, element, info) {
          return new ListenerExpression(this.eventManager, info.attrName, this.parser.parse(info.attrValue), false, true);
        };

        SyntaxInterpreter.prototype.delegate = function delegate(resources, element, info) {
          return new ListenerExpression(this.eventManager, info.attrName, this.parser.parse(info.attrValue), true, true);
        };

        SyntaxInterpreter.prototype.call = function call(resources, element, info, existingInstruction) {
          var instruction = existingInstruction || BehaviorInstruction.attribute(info.attrName);

          instruction.attributes[info.attrName] = new CallExpression(this.observerLocator, info.attrName, this.parser.parse(info.attrValue), resources.valueConverterLookupFunction);

          return instruction;
        };

        SyntaxInterpreter.prototype.options = function options(resources, element, info, existingInstruction) {
          var instruction = existingInstruction || BehaviorInstruction.attribute(info.attrName),
              attrValue = info.attrValue,
              language = this.language,
              name = null,
              target = '',
              current,
              i,
              ii;

          for (i = 0, ii = attrValue.length; i < ii; ++i) {
            current = attrValue[i];

            if (current === ';') {
              info = language.inspectAttribute(resources, name, target.trim());
              language.createAttributeInstruction(resources, element, info, instruction);

              if (!instruction.attributes[info.attrName]) {
                instruction.attributes[info.attrName] = info.attrValue;
              }

              target = '';
              name = null;
            } else if (current === ':' && name === null) {
              name = target.trim();
              target = '';
            } else {
              target += current;
            }
          }

          if (name !== null) {
            info = language.inspectAttribute(resources, name, target.trim());
            language.createAttributeInstruction(resources, element, info, instruction);

            if (!instruction.attributes[info.attrName]) {
              instruction.attributes[info.attrName] = info.attrValue;
            }
          }

          return instruction;
        };

        return SyntaxInterpreter;
      })();

      _export('SyntaxInterpreter', SyntaxInterpreter);

      SyntaxInterpreter.prototype['for'] = function (resources, element, info, existingInstruction) {
        var parts, keyValue, instruction, attrValue, isDestructuring;
        attrValue = info.attrValue;
        isDestructuring = attrValue.match(/[[].+[\]]/);
        parts = isDestructuring ? attrValue.split('of ') : attrValue.split(' of ');

        if (parts.length !== 2) {
          throw new Error('Incorrect syntax for "for". The form is: "$local of $items" or "[$key, $value] of $items".');
        }

        instruction = existingInstruction || BehaviorInstruction.attribute(info.attrName);

        if (isDestructuring) {
          keyValue = parts[0].replace(/[[\]]/g, '').replace(/,/g, ' ').replace(/\s+/g, ' ').trim().split(' ');
          instruction.attributes.key = keyValue[0];
          instruction.attributes.value = keyValue[1];
        } else {
          instruction.attributes.local = parts[0];
        }

        instruction.attributes.items = new BindingExpression(this.observerLocator, 'items', this.parser.parse(parts[1]), bindingMode.oneWay, resources.valueConverterLookupFunction);

        return instruction;
      };

      SyntaxInterpreter.prototype['two-way'] = function (resources, element, info, existingInstruction) {
        var instruction = existingInstruction || BehaviorInstruction.attribute(info.attrName);

        instruction.attributes[info.attrName] = new BindingExpression(this.observerLocator, this.attributeMap[info.attrName] || info.attrName, this.parser.parse(info.attrValue), bindingMode.twoWay, resources.valueConverterLookupFunction);

        return instruction;
      };

      SyntaxInterpreter.prototype['one-way'] = function (resources, element, info, existingInstruction) {
        var instruction = existingInstruction || BehaviorInstruction.attribute(info.attrName);

        instruction.attributes[info.attrName] = new BindingExpression(this.observerLocator, this.attributeMap[info.attrName] || info.attrName, this.parser.parse(info.attrValue), bindingMode.oneWay, resources.valueConverterLookupFunction);

        return instruction;
      };

      SyntaxInterpreter.prototype['one-time'] = function (resources, element, info, existingInstruction) {
        var instruction = existingInstruction || BehaviorInstruction.attribute(info.attrName);

        instruction.attributes[info.attrName] = new BindingExpression(this.observerLocator, this.attributeMap[info.attrName] || info.attrName, this.parser.parse(info.attrValue), bindingMode.oneTime, resources.valueConverterLookupFunction);

        return instruction;
      };

      info = {};
      logger = LogManager.getLogger('templating-binding');

      TemplatingBindingLanguage = (function (_BindingLanguage) {
        _inherits(TemplatingBindingLanguage, _BindingLanguage);

        TemplatingBindingLanguage.inject = function inject() {
          return [Parser, ObserverLocator, SyntaxInterpreter];
        };

        function TemplatingBindingLanguage(parser, observerLocator, syntaxInterpreter) {
          _classCallCheck(this, TemplatingBindingLanguage);

          _BindingLanguage.call(this);
          this.parser = parser;
          this.observerLocator = observerLocator;
          this.syntaxInterpreter = syntaxInterpreter;
          this.emptyStringExpression = this.parser.parse('\'\'');
          syntaxInterpreter.language = this;
          this.attributeMap = syntaxInterpreter.attributeMap = {
            'contenteditable': 'contentEditable',
            'for': 'htmlFor',
            'tabindex': 'tabIndex',
            'textcontent': 'textContent',
            'innerhtml': 'innerHTML',

            'maxlength': 'maxLength',
            'minlength': 'minLength',
            'formaction': 'formAction',
            'formenctype': 'formEncType',
            'formmethod': 'formMethod',
            'formnovalidate': 'formNoValidate',
            'formtarget': 'formTarget',
            'rowspan': 'rowSpan',
            'colspan': 'colSpan',
            'scrolltop': 'scrollTop',
            'scrollleft': 'scrollLeft',
            'readonly': 'readOnly'
          };
          this.knownBindings = [{
            'bind': ['bind'],
            'trigger': ['trigger'],
            'delegate': ['delegate'],
            'for': ['for']
          }, {
            'one-way': ['one', 'way'],
            'two-way': ['two', 'way'],
            'one-time': ['one', 'time']
          }];
        }

        TemplatingBindingLanguage.prototype.inspectAttribute = function inspectAttribute(resources, attrName, attrValue) {
          var _this = this;

          var parts = attrName.split('-'),
              command = [parts.pop()];

          info.defaultBindingMode = null;

          if (parts.length == 1 && Object.keys(this.knownBindings[0]).includes(command[0]) || parts.length > 1 && command.push(parts.pop()) == 2 && Object.keys(this.knownBindings[1]).some(function (key) {
            return _this.knownBindings[1][key] === command;
          })) {
            info.attrName = parts.join('-').trim();
            info.attrValue = attrValue;
            info.command = command.join('-').trim();

            if (info.command === 'ref') {
              info.expression = new NameExpression(attrValue, info.attrName);
              info.command = null;
              info.attrName = 'ref';
            } else {
              info.expression = null;
            }
          } else if (attrName == 'ref') {
            info.attrName = attrName;
            info.attrValue = attrValue;
            info.command = null;
            info.expression = new NameExpression(attrValue, 'element');
          } else {
            info.attrName = attrName;
            info.attrValue = attrValue;
            info.command = null;
            info.expression = this.parseContent(resources, attrName, attrValue);
          }

          return info;
        };

        TemplatingBindingLanguage.prototype.createAttributeInstruction = function createAttributeInstruction(resources, element, info, existingInstruction) {
          var instruction;

          if (info.expression) {
            if (info.attrName === 'ref') {
              return info.expression;
            }

            instruction = existingInstruction || BehaviorInstruction.attribute(info.attrName);
            instruction.attributes[info.attrName] = info.expression;
          } else if (info.command) {
            instruction = this.syntaxInterpreter.interpret(resources, element, info, existingInstruction);
          }

          return instruction;
        };

        TemplatingBindingLanguage.prototype.parseText = function parseText(resources, value) {
          return this.parseContent(resources, 'textContent', value);
        };

        TemplatingBindingLanguage.prototype.parseContent = function parseContent(resources, attrName, attrValue) {
          var i = attrValue.indexOf('${', 0),
              ii = attrValue.length,
              char,
              pos = 0,
              open = 0,
              quote = null,
              interpolationStart,
              parts,
              partIndex = 0;
          while (i >= 0 && i < ii - 2) {
            open = 1;
            interpolationStart = i;
            i += 2;

            do {
              char = attrValue[i];
              i++;
              switch (char) {
                case "'":
                case '"':
                  if (quote === null) {
                    quote = char;
                  } else if (quote === char) {
                    quote = null;
                  }
                  continue;
                case '\\':
                  i++;
                  continue;
              }

              if (quote !== null) {
                continue;
              }

              if (char === '{') {
                open++;
              } else if (char === '}') {
                open--;
              }
            } while (open > 0 && i < ii);

            if (open === 0) {
              parts = parts || [];
              if (attrValue[interpolationStart - 1] === '\\' && attrValue[interpolationStart - 2] !== '\\') {
                parts[partIndex] = attrValue.substring(pos, interpolationStart - 1) + attrValue.substring(interpolationStart, i);
                partIndex++;
                parts[partIndex] = this.emptyStringExpression;
                partIndex++;
              } else {
                parts[partIndex] = attrValue.substring(pos, interpolationStart);
                partIndex++;
                parts[partIndex] = this.parser.parse(attrValue.substring(interpolationStart + 2, i - 1));
                partIndex++;
              }
              pos = i;
              i = attrValue.indexOf('${', i);
            } else {
              break;
            }
          }

          if (partIndex === 0) {
            return null;
          }

          parts[partIndex] = attrValue.substr(pos);

          return new InterpolationBindingExpression(this.observerLocator, this.attributeMap[attrName] || attrName, parts, bindingMode.oneWay, resources.valueConverterLookupFunction, attrName);
        };

        return TemplatingBindingLanguage;
      })(BindingLanguage);

      _export('TemplatingBindingLanguage', TemplatingBindingLanguage);

      InterpolationBindingExpression = (function () {
        function InterpolationBindingExpression(observerLocator, targetProperty, parts, mode, valueConverterLookupFunction, attribute) {
          _classCallCheck(this, InterpolationBindingExpression);

          this.observerLocator = observerLocator;
          this.targetProperty = targetProperty;
          this.parts = parts;
          this.mode = mode;
          this.valueConverterLookupFunction = valueConverterLookupFunction;
          this.attribute = this.attrToRemove = attribute;
          this.discrete = false;
        }

        InterpolationBindingExpression.prototype.createBinding = function createBinding(target) {
          return new InterpolationBinding(this.observerLocator, this.parts, target, this.targetProperty, this.mode, this.valueConverterLookupFunction);
        };

        return InterpolationBindingExpression;
      })();

      _export('InterpolationBindingExpression', InterpolationBindingExpression);

      InterpolationBinding = (function () {
        function InterpolationBinding(observerLocator, parts, target, targetProperty, mode, valueConverterLookupFunction) {
          _classCallCheck(this, InterpolationBinding);

          if (targetProperty === 'style') {
            logger.info('Internet Explorer does not support interpolation in "style" attributes.  Use the style attribute\'s alias, "css" instead.');
          } else if (target.parentElement && target.parentElement.nodeName === 'TEXTAREA' && targetProperty === 'textContent') {
            throw new Error('Interpolation binding cannot be used in the content of a textarea element.  Use <textarea value.bind="expression"></textarea> instead.');
          }
          this.observerLocator = observerLocator;
          this.parts = parts;
          this.targetProperty = observerLocator.getObserver(target, targetProperty);
          this.mode = mode;
          this.valueConverterLookupFunction = valueConverterLookupFunction;
          this.toDispose = [];
        }

        InterpolationBinding.prototype.getObserver = function getObserver(obj, propertyName) {
          return this.observerLocator.getObserver(obj, propertyName);
        };

        InterpolationBinding.prototype.bind = function bind(source) {
          this.source = source;

          if (this.mode == bindingMode.oneWay) {
            this.unbind();
            this.connect();
            this.setValue();
          } else {
            this.setValue();
          }
        };

        InterpolationBinding.prototype.setValue = function setValue() {
          var value = this.interpolate();
          this.targetProperty.setValue(value);
        };

        InterpolationBinding.prototype.partChanged = function partChanged(newValue, oldValue, connecting) {
          var _this2 = this;

          var map, info;
          if (!connecting) {
            this.setValue();
          }
          if (oldValue instanceof Array) {
            map = this.arrayPartMap;
            info = map ? map.get(oldValue) : null;
            if (info) {
              info.refs--;
              if (info.refs === 0) {
                info.dispose();
                map['delete'](oldValue);
              }
            }
          }
          if (newValue instanceof Array) {
            map = this.arrayPartMap || (this.arrayPartMap = new Map());
            info = map.get(newValue);
            if (!info) {
              info = {
                refs: 0,
                dispose: this.observerLocator.getArrayObserver(newValue).subscribe(function () {
                  return _this2.setValue();
                })
              };
              map.set(newValue, info);
            }
            info.refs++;
          }
        };

        InterpolationBinding.prototype.connect = function connect() {
          var info,
              parts = this.parts,
              source = this.source,
              toDispose = this.toDispose = [],
              partChanged = this.partChanged.bind(this),
              i,
              ii;

          for (i = 0, ii = parts.length; i < ii; ++i) {
            if (i % 2 === 0) {} else {
                info = parts[i].connect(this, source);
                if (info.observer) {
                  toDispose.push(info.observer.subscribe(partChanged));
                }
                if (info.value instanceof Array) {
                  partChanged(info.value, undefined, true);
                }
              }
          }
        };

        InterpolationBinding.prototype.interpolate = function interpolate() {
          var value = '',
              parts = this.parts,
              source = this.source,
              valueConverterLookupFunction = this.valueConverterLookupFunction,
              i,
              ii,
              temp;

          for (i = 0, ii = parts.length; i < ii; ++i) {
            if (i % 2 === 0) {
              value += parts[i];
            } else {
              temp = parts[i].evaluate(source, valueConverterLookupFunction);
              value += typeof temp !== 'undefined' && temp !== null ? temp.toString() : '';
            }
          }

          return value;
        };

        InterpolationBinding.prototype.unbind = function unbind() {
          var i,
              ii,
              toDispose = this.toDispose,
              map = this.arrayPartMap;

          if (toDispose) {
            for (i = 0, ii = toDispose.length; i < ii; ++i) {
              toDispose[i]();
            }
          }

          this.toDispose = null;

          if (map) {
            for (var _iterator = map.values(), _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
              if (_isArray) {
                if (_i >= _iterator.length) break;
                toDispose = _iterator[_i++];
              } else {
                _i = _iterator.next();
                if (_i.done) break;
                toDispose = _i.value;
              }

              toDispose.dispose();
            }
            map.clear();
          }

          this.arrayPartMap = null;
        };

        return InterpolationBinding;
      })();
    }
  };
});