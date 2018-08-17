'use strict';

import React from 'react';
import {clicker} from './utils';

// iOS-style toggle switch

export class ToggleSwitch extends React.Component {
  render() {
    const checked = this.props.checked;
    const classes = 'form-multi-option form-multi-option-' + (checked ? 'on' : 'off');
    return (
      <a href="#" className={classes} onClick={clicker(() => this.props.onClick(!checked))}>
        <span className="form-multi-option-text">{ this.props.children }</span>
        <span className="form-multi-option-switch">
          <span className="form-multi-option-ball" />
        </span>
      </a>
    );
  }
}

ToggleSwitch.defaultProps = {
  checked: false,
  onClick: function(){},
};
