import './App.css'
import { Editor } from '@monaco-editor/react'
import { MonacoBinding } from 'y-monaco'
import { useRef, useMemo, useState, useEffect } from 'react'
import * as Y from 'yjs'
import { SocketIOProvider } from 'y-socket.io'

const App = () => {
  const editorRef = useRef(null);
  const [username, setUsername] = useState(() => {
    return new URLSearchParams(window.location.search).get("username") || ""
  });
  const [users, setUsers] = useState([]);
  const [editorMounted, setEditorMounted] = useState(false);

  const ydoc = useMemo(() => new Y.Doc(), [])
  const ytext = useMemo(() => ydoc.getText("monaco"), [ydoc])

  const handleMount = (editor) => {
    editorRef.current = editor;
    setEditorMounted(true);
  }

  const handlejoin = (e) => {
    e.preventDefault(); //page won't reload
    setUsername(e.target.username.value);
    window.history.pushState({}, '', '?username=' + e.target.username.value);
    // works as localStorage and saves username as parameter
  }

  useEffect(() => {
    if (username && editorRef.current) {
      // const provider = new SocketIOProvider("http://localhost:3000", "monaco", ydoc, {
      const provider = new SocketIOProvider(window.location.origin, "monaco", ydoc, {
        autoConnect: true
      });

      // sets name of the local state field same as the local user's username
      provider.awareness.setLocalStateField("user", { username });

      provider.awareness.on("change",() => {

        const states = Array.from(provider.awareness.getStates().values())
        setUsers(states.filter(state => state.user && state.user.username).map(state => state.user))
      })

      function handleBeforeUnload() {
        provider.awareness.setLocalStateField("user", null);
      }

      window.addEventListener("beforeunload", handleBeforeUnload);

      const monacoBinding = new MonacoBinding(
        ytext,
        editorRef.current.getModel(),
        new Set([editorRef.current]),
        provider.awareness
      )

      return () => {
        window.removeEventListener("beforeunload", handleBeforeUnload);
        monacoBinding.destroy();
        provider.destroy();
      }
    }
  }, [
    editorMounted,
    username
  ])

  if (!username) {
    return (
      <main className='h-screen w-full bg-gray-950 flex gap-4 p-4 items-center justify-center'>
        <form
          onSubmit={handlejoin}
          className='flex flex-col gap-4'>
          <input
            type="text"
            placeholder='Enter Username'
            className='p-2 rounded-lg bg-gray-800 text-white'
            name='username'
          />
          <button
            className='p-2 rounded-lg bg-amber-50 text-gray-950 font-bold'
          >
            Join
          </button>
        </form>
      </main>
    )
  }

  return (
    <main className='h-screen w-full bg-gray-950 flex gap-4 p-4'>
      <aside className='h-full w-1/4 bg-amber-50 rounded-lg'>
        <h2 className='text-2xl font-bold p-4 border-b border-gray-300'>Users</h2>
        <ul className='p-4'>
          {users.map((user,index) => (
          <li key={index} className='p-4 bg-gray-800 text-white rounded-md mb-2 tracking-wider'>
            {user.username}
          </li>
          ))}
        </ul>
      </aside>
      <section className='h-full w-3/4 bg-neutral-800 rounded-lg overflow-hidden'>
        <Editor
          height='100%'
          defaultLanguage='cpp'
          defaultValue='// Hello There'
          theme='vs-dark'
          onMount={handleMount}
        />
      </section>
    </main>
  )
}

export default App