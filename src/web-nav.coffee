'use strict'

React = require 'react'
T = require 'prop-types'
createClass = require 'create-react-class'

{ Auth
, arisHTTPS
} = require './aris'

{clicker, withSuccess} = require './utils'

export WebNav = createClass
  propTypes:
    auth: T.instanceOf(Auth).isRequired
    onLogin: T.func
    onRegister: T.func
    onLogout: T.func
    hasBrowserButton: T.bool
    onBrowserButton: T.func
    menuOpen: T.bool
    onMenuMove: T.func
    online: T.bool

  getDefaultProps: ->
    onLogin: (->)
    onRegister: (->)
    onLogout: (->)
    hasBrowserButton: false
    onBrowserButton: (->)
    menuOpen: false
    onMenuMove: (->)

  getInitialState: ->
    hasBrowserButton: false
    onBrowserButton: (->)
    userPicture: null

  goBackToBrowser: ->
    @props.onMenuMove false
    @props.onBrowserButton()

  componentWillMount: ->
    @fetchPicture()

  componentWillReceiveProps: (nextProps) ->
    if @props.auth isnt nextProps.auth
      @fetchPicture nextProps.auth

  fetchPicture: (auth = @props.auth) ->
    media_id = auth.authToken?.media_id
    unless media_id?
      @setState userPicture: null
      return
    if @props.online
      @props.auth.call 'media.getMedia',
        media_id: media_id
      , withSuccess (userPicture) =>
        @setState {userPicture}

  render: ->
    userPic = @state.userPicture?.big_thumb_url
    unless @state.userPicture? and parseInt(@state.userPicture.media_id)
      userPic = null
    if userPic?
      userPic = arisHTTPS userPic
    <div className={"auth-container #{if @props.menuOpen then 'auth-menu-open' else 'auth-menu-closed'}"}>
      <div className="auth-nav">
        <div className="auth-nav-side">
          <a target="_blank" href="https://siftr.org">
            <img className="auth-nav-logo" src="assets/img/siftr-logo-black.png" />
          </a>
          <a target="_blank" href="https://siftr.org/discover/">Discover</a>
        </div>
        <div className="auth-nav-side">
          {
            if @props.auth.authToken?
              <a href="#"
                onClick={clicker => @props.onMenuMove not @props.menuOpen}
              >
                <img className="auth-nav-user-pic" src={userPic} />
                {@props.auth.authToken.display_name}
              </a>
            else
              <a href="#"
                onClick={clicker => @props.onMenuMove not @props.menuOpen}
              >Log in</a>
          }
        </div>
      </div>
      <div className="auth-contents">
        {@props.children}
      </div>
      <div className="auth-menu-layer" onClick={clicker => @props.onMenuMove false}>
        <div className="auth-menu" onClick={(e) => e.stopPropagation()}>
          {
            if @props.auth.authToken?
              <div>
                <div className="auth-menu-user-picture" style={
                  backgroundImage:
                    if userPic
                      "url(#{userPic})"
                } />
                <p>
                  {@props.auth.authToken.display_name}
                </p>
                <p>
                  <button type="button" onClick={@props.onLogout}>Logout</button>
                </p>
              </div>
            else
              <LoginBox onLogin={@props.onLogin} onRegister={@props.onRegister} />
          }
        </div>
      </div>
    </div>

LoginBox = createClass
  propTypes:
    onLogin: T.func
    onRegister: T.func

  getDefaultProps: ->
    onLogin: (->)
    onRegister: (->)

  getInitialState: ->
    registering: false

  doLogin: ->
    if @state.registering
      if @refs.password.value is ''
        alert "You must enter a password."
      else if @refs.password.value isnt @refs.password2.value
        alert "Passwords don't match."
      else
        @props.onRegister @refs.username.value, @refs.password.value, @refs.email.value
    else
      @props.onLogin @refs.username.value, @refs.password.value

  handleEnter: (e) ->
    @doLogin() if e.keyCode is 13

  render: ->
    if @state.registering
      <form>
        <p>
          <img src="assets/img/siftr-logo-black-thin.png" style={
            height: 80
          } />
        </p>
        <p>
          <input
            placeholder="username"
            type="text"
            ref="username"
            onKeyDown={@handleEnter}
            className="login-field"
          />
        </p>
        <p>
          <input
            placeholder="password"
            type="password"
            ref="password"
            onKeyDown={@handleEnter}
            className="login-field"
          />
        </p>
        <p>
          <input
            placeholder="repeat password"
            type="password"
            ref="password2"
            onKeyDown={@handleEnter}
            className="login-field"
          />
        </p>
        <p>
          <input
            placeholder="email (optional)"
            type="text"
            ref="email"
            onKeyDown={@handleEnter}
            className="login-field"
          />
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
          <a className="auth-button-log-in" href="#" onClick={clicker @doLogin}>sign up</a>
        </div>
        <p>
          <a className="auth-button-sign-up" href="#" onClick={clicker => @setState registering: false}>
            Back to login
          </a>
        </p>
      </form>
    else
      <form>
        <p>
          <img src="assets/img/siftr-logo-black-thin.png" style={
            height: 80
          } />
        </p>
        <p>
          <input
            placeholder="username"
            type="text"
            ref="username"
            onKeyDown={@handleEnter}
            className="login-field"
          />
        </p>
        <p>
          <input
            placeholder="password"
            type="password"
            ref="password"
            onKeyDown={@handleEnter}
            className="login-field"
          />
        </p>
        <div className="auth-button-row">
          <a className="auth-button-log-in" href="#" onClick={clicker @doLogin}>log in</a>
          <a className="auth-button-forgot" href="https://siftr.org/login/#forgot">forgot password?</a>
        </div>
        <p>
          <a className="auth-button-sign-up" href="#" onClick={clicker => @setState registering: true}>
            Don't have an account yet? Sign up!
          </a>
        </p>
      </form>
