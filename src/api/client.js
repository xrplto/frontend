export default function appReducer(state = initialState, action) {
    switch (action.type) {
      case 'todos/todoAdded': {
        return {
          ...state,
          todos: [
            ...state.todos,
            {
              id: nextTodoId(state.todos),
              text: action.payload,
              completed: false
            }
          ]
        }
      }
      case 'todos/todoToggled': {
        return {
          // Again copy the entire state object
          ...state,
          // This time, we need to make a copy of the old todos array
          todos: state.todos.map(todo => {
            // If this isn't the todo item we're looking for, leave it alone
            if (todo.id !== action.payload) {
              return todo
            }
  
            // We've found the todo that has to change. Return a copy:
            return {
              ...todo,
              // Flip the completed flag
              completed: !todo.completed
            }
          })
        }
      }
      case 'filters/statusFilterChanged': {
        return {
          // Copy the whole state
          ...state,
          // Overwrite the filters value
          filters: {
            // copy the other filter fields
            ...state.filters,
            // And replace the status field with the new value
            status: action.payload
          }
        }
      }
      default:
        return state
    }
  }