import React from 'react'
import ReactDOM from 'react-dom'
import App from './js/components/App'
import './style/App.min.css'
import './bootstrap/dist/css/bootstrap.min.css'
import './font-awesome/css/font-awesome.min.css'
import { Provider } from 'react-redux'
import store from './js/reducers/store'
ReactDOM.render(
  <Provider store={store}><App /></Provider>,
  document.getElementById('root')
);
