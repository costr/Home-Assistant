class CustomFanCard extends Polymer.Element {

    static get template() {
        return Polymer.html`
            <style is="custom-style" include="iron-flex iron-flex-alignment"></style>
            <style>
                :host {
                    line-height: inherit;
                }
                .speed {
                    min-width: 34px;
                    max-width: 34px;
                    height: 34px;
                    margin: 0 2px;
                    background-color:'var(--dark-accent-color)';
	                border: 1px var(--dark-theme-disabled-color);
                    border-radius: 4px;
	                font-size: 11px !important;
                    text-align: center;
	                float: right !important;
                    padding: 1px;
                    font-family : inherit;
                }
            </style>

            <hui-generic-entity-row hass="[[hass]]" config="[[_config]]">
                <div class='horizontal justified layout' on-click="stopPropagation">
                    <button
                            class='speed'
                            style='[[_offColor]]'
                            toggles name="off"
                            on-click='setSpeed'
                            disabled='[[_isOffState]]'>OFF</button>
				    <button
                            class='speed'
                            style='[[_lowOnColor]]'
                            toggles name="low"
                            on-click='setSpeed'
                            disabled='[[_isOnLow]]'>LOW</button>
                    <button
                            class='speed'
                            style='[[_medOnColor]]'
                            toggles name="medium"
                            on-click='setSpeed'
                            disabled='[[_isOnMed]]'>MED</button>
                    <button
                            class='speed'
                            style='[[_highOnColor]]'
                            toggles name="high"
                            on-click='setSpeed'
                            disabled='[[_isOnHigh]]'>HIGH</button>

                    </div>
            </hui-generic-entity-row>
        `;
    }

    static get properties() {
        return {
            hass: {
                type: Object,
                observer: 'hassChanged'
            },
            _config: Object,
            _stateObj: Object,
            _lowOnColor: String,
            _medOnColor: String,
            _highOnColor: String,
            _offColor: String,
            _isOffState: Boolean,
            _isOnState: Boolean,
            _isOnLow: Boolean,
            _isOnMed: Boolean,
            _isOnHigh: Boolean
        }
    }

    setConfig(config) {
        this._config = config;
    }

    hassChanged(hass) {
        const style = "background-color: var(--dark-primary-color); color: white;";

        const stateObj = hass.states[this._config.entity];

        let speed = this.getSpeed(stateObj);

        let isLow = speed == "low";
	let isMed = speed == "medium";
	let isHigh = speed == "high";
	let isOff = stateObj.state != "on";

        this.setProperties({
            _stateObj: stateObj,
            _isOffState: isOff,
            _isOnLow: isLow,
            _isOnMed: isMed,
            _isOnHigh: isHigh,
            _lowOnColor: isLow ? style : '',
            _medOnColor: isMed ? style : '',
            _highOnColor: isHigh ?  style : '',
            _offColor: isOff ? style : ''
        });
    }

    getSpeed(stateObj) {
        const entityName = stateObj.entity_id;
        const type = entityName.substring(entityName.indexOf('.'), 0);
        let speed;
        switch(type) {
            case "fan":
                speed = this.getSpeedForFanType(stateObj);
                break;
            case "light":
                speed = this.getSpeedNameForLightType(stateObj);
                break;
        }
        return speed;
    }

    getSpeedForFanType(stateObj) {
        if (stateObj && stateObj.attributes) {
            speed = stateObj.attributes.speed || "off";
        }
        return "off";
    }

    getSpeedNameForLightType(stateObj) {
        let brightness = stateObj.attributes.brightness;

        if(stateObj.state == "off" || !brightness || brightness < 1) {
            return "off";
        }

        if(brightness > 0 && brightness < 86) {
            return "low";
        }

        if(brightness > 85 && brightness < 171) {
            return "medium";
        }

        return "high";
    }

    getSpeedNumberForLightType(speedName) {
        let maxSpeed = 255;
        switch(speedName) {
            case "high":
                return maxSpeed;
            case "medium":
                return maxSpeed / 2;
            case "low":
                return (maxSpeed / 2) / 2;
            default:
                return 0;
        }
    }

    stopPropagation(e) {
        e.stopPropagation();
    }

    setSpeed(e) {
        const speed = e.currentTarget.getAttribute('name');

        let type = this._stateObj.entity_id.substring(this._stateObj.entity_id.indexOf('.'), 0);

        switch(type) {
            case "fan":
                this.hass.callService("fan", "set_speed", {
                    entity_id: this._config.entity,
                    speed: speed
                });
                break;
            case "light":
                let brightness = this.getSpeedNumberForLightType(speed);
                this.hass.callService("light", "turn_on", {
                    entity_id: this._config.entity,
                    brightness: brightness
                });
                break;
        }
    }
}

customElements.define('custom-fan-card', CustomFanCard);
