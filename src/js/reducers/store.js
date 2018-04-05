import { applyMiddleware, combineReducers, createStore } from 'redux'
import { createLogger } from 'redux-logger'
import thunk from 'redux-thunk'

const userReducer = (state={}, action) => {
  switch (action.type) {
    case 'CHANGE_NAME':
      state = {...state, name: action.payload}
      break;
    case 'CHANGE_FAV':
      state = {...state, fav: action.payload}
      break;
  }
  return state
}

const gamesReducer = (state=[], action) => {
  switch (action.type) {
    case 'ADD_GAME':
      state = state.concat(action.payload)
      break;
    case 'CLEAR_GAMES':
      state = []
      break;
  }
  return state
}

const reducers = combineReducers({
  user: userReducer,
  games: gamesReducer
})

const reducer = (state={}, action) => {
  return state
}

const middleware = applyMiddleware(thunk, createLogger())

export default createStore(reducers, middleware)

// store.dispatch((dispatch) => {
//   dispatch({type: 'CHANGE_NAME', payload: 'tbarn2'})
//   // do something async
// })
// store.dispatch({type: 'CHANGE_FAV', payload: 'PIT'})
// store.dispatch({type: 'CHANGE_FAV', payload: 'TOR'})
