import { GetServerSideProps } from "next";
import styles from './styles.module.css';
import Head from 'next/head';
import { getSession } from 'next-auth/react';
import { ChangeEvent, FormEvent, useState, useEffect } from 'react';
import { Textarea } from '../../components/Textarea';

import { FiShare2 } from 'react-icons/fi';
import { FaTrash } from 'react-icons/fa';
import { AiFillEdit } from 'react-icons/ai'

// importando métodos do firestore para integrar Data Base
import { db } from '../../services/firebaseConnection';
import { addDoc, collection, query, orderBy, where, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';

import Link from "next/link";

interface HomeProps {
    user: {
        email: string;
    };
}

interface TaskProps {
    id: string;
    created: Date;
    public: boolean;
    tarefa: string;
    user: string;
}

export default function Dashboard({ user }: HomeProps) {

    const [input, setInput] = useState("");
    const [publicTask, setPublicTask] = useState(false);
    const [tasks, setTasks] = useState<TaskProps[]>([]);
    const [editTaskId, setEditTaskId] = useState<string | null>(null);

    useEffect(() => {
        async function loadTarefas() {
            const tarefasRef = collection(db, "tarefas")
            const q = query(
                tarefasRef,
                orderBy("created", "desc"),
                where("user", "==", user?.email)
            );

            onSnapshot(q, (snapshot) => {
                let lista = [] as TaskProps[];

                snapshot.forEach((doc) => {
                    lista.push({
                        id: doc.id,
                        tarefa: doc.data().tarefa,
                        created: doc.data().created,
                        user: doc.data().user,
                        public: doc.data().public,
                    });
                });

                setTasks(lista);
            });
        }

        loadTarefas();
    }, [user?.email]);

    // Função para alterar o estado 'checked' do checkbox (Deixar tarefa pública)
    function handleChangePublic(event: ChangeEvent<HTMLInputElement>) {
        setPublicTask(event.target.checked);
    }

    // Função assíncrona para comunicar com o Banco de Dados
    async function handleRegisterTask(event: FormEvent, taskId?: string) {
        event.preventDefault();

        if (input === "") return;

        try {
            if (taskId) {
                // Editar a tarefa existente
                const docRef = doc(db, "tarefas", taskId);
                await updateDoc(docRef, {
                    tarefa: input,
                    public: publicTask,
                });
            } else {
                // Criar uma nova tarefa
                await addDoc(collection(db, "tarefas"), {
                    tarefa: input,
                    created: new Date(),
                    user: user?.email,
                    public: publicTask,
                });
            }
                setInput("");
                setPublicTask(false);
                setEditTaskId(null);
            } catch (err) {
                console.log(err);
            }
    }

    async function handleShare(id: string) {
        await navigator.clipboard.writeText(
          `${process.env.NEXT_PUBLIC_URL}/task/${id}`
        );
    
        alert("URL Copiada com sucesso!");
    }
    
    async function handleDeleteTask(id: string) {
        const docRef = doc(db, "tarefas", id);
        await deleteDoc(docRef);
    }

    function handleEditTask(taskId: string) {
        const task = tasks.find((item) => item.id === taskId);
        if (task) {
          setInput(task.tarefa);
          setPublicTask(task.public);
          setEditTaskId(taskId);
        }
    }

    return (
        <div className={styles.container}>
            <Head>
                <title>Meu Painel de tarefas</title>
            </Head>

            <main className={styles.main}>

                {/* Parte de cima do Dashboard */}
                <section className={styles.content}>
                    <div className={styles.contentForm}>
                        <h1 className={styles.title}>Qual a sua Tarefa?</h1>

                        <form onSubmit={(event) => handleRegisterTask(event, editTaskId ?? undefined)}>
                            <Textarea
                                placeholder="Digite qual a sua tarefa..."
                                value={input}
                                onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                                    setInput(event.target.value)
                                }
                            />
                            <div className={styles.checkboxArea}>
                                <input
                                    type="checkbox"
                                    className={styles.checkbox}
                                    checked={publicTask}
                                    onChange={handleChangePublic}
                                />
                                <label>Deixar tarefa pública?</label>
                            </div>

                            <button type="submit" className={styles.button}>
                                {editTaskId ? "Salvar" : "Registrar"}
                            </button>

                        </form>
                    </div>
                </section>

                {/* Lista de Tarefas */}
                <section className={styles.taskContainer}>
                    <h1>Minhas tarefas</h1>

                    {tasks.map((item) => (
                        <article key={item.id} className={styles.task}>

                            {/* Se a tarefa for marcada como Pública, mostrar a tag e ícone*/}
                            {item.public && (
                                <div className={styles.tagContainer}>
                                    <label className={styles.tag}>PÚBLICO</label>
                                    <button
                                        className={styles.shareButton}
                                        onClick={() => handleShare(item.id)}
                                    >
                                        <FiShare2 size={22} color="#3183ff" />
                                    </button>
                                </div>
                            )}

                            <div className={styles.taskContent}>
                                {item.public ? (
                                    <Link href={`/task/${item.id}`}>
                                        <p>{item.tarefa}</p>
                                    </Link>
                                ) : (
                                    <p>{item.tarefa}</p>
                                )}

                                <div className={styles.buttonContent}>
                                    <button
                                        className={styles.editButton}
                                        onClick={() => handleEditTask(item.id)}
                                    >
                                        <AiFillEdit size={26} color="#808080" />
                                    </button>

                                    <button
                                        className={styles.trashButton}
                                        onClick={() => handleDeleteTask(item.id)}
                                    >
                                        <FaTrash size={24} color="#ea3140" />
                                    </button>
                                </div>
                            </div>
                        </article>
                    ))}
                </section>
            </main>
        </div>
    )
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
    // Retornar no servidor os dados do User ao logar
    const session = await getSession({ req });

    if (!session?.user) {
        //Se não tem usuário, redirecionar para Home ("/")
        return {
            redirect: {
                destination: "/",
                permanent: false,
            }
        }
    }

    return {
        props: {
            user: {
                email: session?.user?.email,
            }
        },
    }
}