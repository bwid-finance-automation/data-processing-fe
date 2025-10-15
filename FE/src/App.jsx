import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import SinglePage from './pages/SinglePage'
import './App.css'

function App() {
  return (
    <>
      <SinglePage />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </>
  )
}

export default App
