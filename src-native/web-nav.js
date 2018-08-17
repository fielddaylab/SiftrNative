'use strict';

import React from 'react';
import T from 'prop-types';
import createClass from 'create-react-class';
import {Auth, arisHTTPS} from './aris';
import {clicker, withSuccess} from './utils';

export var WebNav = createClass({
  displayName: 'WebNav',
  propTypes: {
    auth: T.instanceOf(Auth).isRequired,
    onLogin: T.func,
    onRegister: T.func,
    onLogout: T.func,
    hasBrowserButton: T.bool,
    onBrowserButton: T.func,
    menuOpen: T.bool,
    onMenuMove: T.func,
    online: T.bool
  },
  getDefaultProps: function() {
    return {
      onLogin: (function() {}),
      onRegister: (function() {}),
      onLogout: (function() {}),
      hasBrowserButton: false,
      onBrowserButton: (function() {}),
      menuOpen: false,
      onMenuMove: (function() {})
    };
  },
  getInitialState: function() {
    return {
      hasBrowserButton: false,
      onBrowserButton: (function() {}),
      userPicture: null
    };
  },
  goBackToBrowser: function() {
    this.props.onMenuMove(false);
    this.props.onBrowserButton();
  },
  componentWillMount: function() {
    this.fetchPicture();
  },
  componentWillReceiveProps: function(nextProps) {
    if (this.props.auth !== nextProps.auth) {
      this.fetchPicture(nextProps.auth);
    }
  },
  fetchPicture: function(auth = this.props.auth) {
    var media_id, ref;
    media_id = (ref = auth.authToken) != null ? ref.media_id : void 0;
    if (media_id == null) {
      this.setState({
        userPicture: null
      });
      return;
    }
    if (this.props.online) {
      this.props.auth.call('media.getMedia', {
        media_id: media_id
      }, withSuccess((userPicture) => {
        this.setState({userPicture});
      }));
    }
  },
  render: function() {
    var ref, userPic;
    userPic = (ref = this.state.userPicture) != null ? ref.big_thumb_url : undefined;
    if (!((this.state.userPicture != null) && parseInt(this.state.userPicture.media_id))) {
      userPic = null;
    }
    if (userPic != null) {
      userPic = arisHTTPS(userPic);
    }
    return <div className={`auth-container ${(this.props.menuOpen ? 'auth-menu-open' : 'auth-menu-closed')}`}>
      <div className="auth-nav">
        <div className="auth-nav-side">
          <a target="_blank" href="https://siftr.org">
            <img className="auth-nav-logo" src="assets/img/siftr-logo-black.png" />
          </a>
          <a target="_blank" href="https://siftr.org/discover/">Discover</a>
          <a target="_blank" href="https://siftr.org/editor/">Editor</a>
        </div>
        <div className="auth-nav-side">
          {
            ( this.props.auth.authToken != null
            ? <a href="#" onClick={clicker(() => {
                this.props.onMenuMove(!this.props.menuOpen);
              })}>
                <img className="auth-nav-user-pic" src={userPic} />
                {this.props.auth.authToken.display_name}
              </a>
            : <a href="#" onClick={clicker(() => {
                this.props.onMenuMove(!this.props.menuOpen);
              })}>Log in</a>
            )
          }
        </div>
      </div>
      <div className="auth-contents">
        {this.props.children}
      </div>
      <div className="auth-menu-layer" onClick={clicker(() => {
        this.props.onMenuMove(false);
      })}>
        <div className="auth-menu" onClick={(e) => {
          e.stopPropagation();
        }}>
          {
            ( this.props.auth.authToken != null
            ? <div>
                <a href="https://siftr.org/editor/#account" target="_blank">
                  <div className="auth-menu-user-picture" style={{
                    backgroundImage: userPic ? `url(${userPic})` : undefined
                  }} />
                  <p>
                    {this.props.auth.authToken.display_name}
                  </p>
                </a>
                <p>
                  <button type="button" onClick={this.props.onLogout}>Logout</button>
                </p>
              </div>
            : <LoginBox onLogin={this.props.onLogin} onRegister={this.props.onRegister} />
            )
          }
        </div>
      </div>
    </div>;
  }
});

const LoginBox = createClass({
  displayName: 'LoginBox',
  propTypes: {
    onLogin: T.func,
    onRegister: T.func
  },
  getDefaultProps: function() {
    return {
      onLogin: (function() {}),
      onRegister: (function() {})
    };
  },
  getInitialState: function() {
    return {
      registering: false
    };
  },
  doLogin: function() {
    if (this.state.registering) {
      if (this.refs.password.value === '') {
        return alert("You must enter a password.");
      } else if (this.refs.password.value !== this.refs.password2.value) {
        return alert("Passwords don't match.");
      } else {
        return this.props.onRegister(this.refs.username.value, this.refs.password.value, this.refs.email.value);
      }
    } else {
      return this.props.onLogin(this.refs.username.value, this.refs.password.value);
    }
  },
  handleEnter: function(e) {
    if (e.keyCode === 13) {
      return this.doLogin();
    }
  },
  render: function() {
    if (this.state.registering) {
      return <form>
        <p>
          <img src="assets/img/siftr-logo-black-thin.png" style={{
          height: 80
        }} />
        </p>
        <p>
          <input placeholder="username" type="text" ref="username" onKeyDown={this.handleEnter} className="login-field" />
        </p>
        <p>
          <input placeholder="password" type="password" ref="password" onKeyDown={this.handleEnter} className="login-field" />
        </p>
        <p>
          <input placeholder="repeat password" type="password" ref="password2" onKeyDown={this.handleEnter} className="login-field" />
        </p>
        <p>
          <input placeholder="email (optional)" type="text" ref="email" onKeyDown={this.handleEnter} className="login-field" />
        </p>
        <p>
          By registering for Siftr, you agree to the
          {' '}
          <a target="_blank" href="https://docs.google.com/document/d/16P8kIfHka-zHXoQcd9mWlUWiOkaTp6I7UcpD_GoB8LY/edit">
            Terms of Use
          </a>
          {' '}
          and
          {' '}
          <a target="_blank" href="https://docs.google.com/document/d/1yLXB67G0NfIgp0AAsRUQYB7-LoyFsrihUydxsL_qrms/edit">
            Privacy Policy
          </a>.
        </p>
        <div className="auth-button-row">
          <a className="auth-button-log-in" href="#" onClick={clicker(this.doLogin)}>sign up</a>
        </div>
        <p>
          <a className="auth-button-sign-up" href="#" onClick={clicker(() => {
            return this.setState({
              registering: false
            });
          })}>
            Back to login
          </a>
        </p>
      </form>;
    } else {
      return <form>
        <p>
          <img src="assets/img/siftr-logo-black-thin.png" style={{
            height: 80
          }} />
        </p>
        <p>
          <input placeholder="username" type="text" ref="username" onKeyDown={this.handleEnter} className="login-field" />
        </p>
        <p>
          <input placeholder="password" type="password" ref="password" onKeyDown={this.handleEnter} className="login-field" />
        </p>
        <div className="auth-button-row">
          <a className="auth-button-log-in" href="#" onClick={clicker(this.doLogin)}>log in</a>
          <a className="auth-button-forgot" href="https://siftr.org/login/#forgot">forgot password?</a>
        </div>
        <p>
          <a className="auth-button-sign-up" href="#" onClick={clicker(() => {
            return this.setState({
              registering: true
            });
          })}>
            Don't have an account yet? Sign up!
          </a>
        </p>
      </form>;
    }
  }
});
