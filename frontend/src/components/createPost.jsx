
import { useEffect, useRef, useState } from "react";
import {
  ImagePlus,
  X,
  LoaderCircle,
  ArrowLeft,
  MessageCircle,
  Send,
} from "lucide-react";
import { FaQuestionCircle, FaPen } from "react-icons/fa";
import { FaRegPenToSquare } from "react-icons/fa6";

import { createPost } from "../services/postService";
import {
  getQuestions,
  getQuestionAnswerCount,
  submitQuestionAnswer,
} from "../services/questionService";

export default function CreatePost({ onPostCreated }) {
  // Existing Post modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  // New Answer modal state
  const [isAnswerModalOpen, setIsAnswerModalOpen] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [answerCounts, setAnswerCounts] = useState({});
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [loadingMoreQuestions, setLoadingMoreQuestions] = useState(false);
  const [questionError, setQuestionError] = useState("");
  const [answerBody, setAnswerBody] = useState("");
  const [answerSubmitting, setAnswerSubmitting] = useState(false);
  const [answerError, setAnswerError] = useState("");
  const [questionPage, setQuestionPage] = useState(1);
  const [hasMoreQuestions, setHasMoreQuestions] = useState(false);

  // Close either modal with Escape.
  useEffect(() => {
    if (!isModalOpen && !isAnswerModalOpen) return;

    const handleEscape = (event) => {
      if (event.key !== "Escape") return;

      if (loading || answerSubmitting) return;

      if (isModalOpen) closePostModal();
      if (isAnswerModalOpen) closeAnswerModal();
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isModalOpen, isAnswerModalOpen, loading, answerSubmitting]);

  // Revoke remaining preview URLs when this component unmounts.
  const previewUrlsRef = useRef([]);

  useEffect(() => {
    previewUrlsRef.current = previewUrls;

    return () => {
      previewUrlsRef.current.forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, [previewUrls]);

  // -----------------------------
  // EXISTING CREATE POST FUNCTIONS
  // -----------------------------

  const openModal = () => {
    setError("");
    setIsModalOpen(true);
  };

  const closePostModal = () => {
    if (loading) return;

    previewUrls.forEach((url) => URL.revokeObjectURL(url));

    setContent("");
    setImages([]);
    setPreviewUrls([]);
    setError("");
    setIsModalOpen(false);
  };

  const handleImageChange = (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    const validImages = selectedFiles.filter((file) =>
      file.type.startsWith("image/")
    );

    if (validImages.length !== selectedFiles.length) {
      setError("Please select image files only.");
    } else {
      setError("");
    }

    setImages((current) => [...current, ...validImages]);

    setPreviewUrls((current) => [
      ...current,
      ...validImages.map((file) => URL.createObjectURL(file)),
    ]);

    event.target.value = "";
  };

  const removeImage = (index) => {
    setImages((current) =>
      current.filter((_, i) => i !== index)
    );

    setPreviewUrls((current) => {
      if (current[index]) {
        URL.revokeObjectURL(current[index]);
      }

      return current.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!content.trim() && images.length === 0) {
      setError("Say something or select at least one image.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const newPost = await createPost(content, images);

      previewUrls.forEach((url) => URL.revokeObjectURL(url));

      setContent("");
      setImages([]);
      setPreviewUrls([]);
      setIsModalOpen(false);

      onPostCreated?.(newPost);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Could not publish your post."
      );
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // ANSWER MODAL FUNCTIONS
  // -----------------------------

  const closeAnswerModal = () => {
    if (answerSubmitting) return;

    setIsAnswerModalOpen(false);
    setSelectedQuestion(null);
    setAnswerBody("");
    setAnswerError("");
    setQuestionError("");
  };

  // Fetch a page of questions and their answer counts.
  const loadQuestionPage = async (page, append = false) => {
    if (append) {
      setLoadingMoreQuestions(true);
    } else {
      setQuestionsLoading(true);
    }

    setQuestionError("");

    try {
      const result = await getQuestions(page, 10);

      const questionsWithCounts = await Promise.all(
        result.questions.map(async (question) => {
          const id = question._id || question.id;

          try {
            const count = await getQuestionAnswerCount(id);

            return { question, id, count };
          } catch {
            // Still show the question if its count cannot be fetched.
            return { question, id, count: 0 };
          }
        })
      );

      if (append) {
        setQuestions((current) => [
          ...current,
          ...questionsWithCounts.map((item) => item.question),
        ]);
      } else {
        setQuestions(
          questionsWithCounts.map((item) => item.question)
        );
      }

      setAnswerCounts((current) => {
        const updated = { ...current };

        questionsWithCounts.forEach(({ id, count }) => {
          updated[id] = count;
        });

        return updated;
      });

      setQuestionPage(page);

      const currentPage = Number(
        result.pagination.currentPage ?? page
      );
      const totalPages = Number(
        result.pagination.totalPages ?? currentPage
      );

      setHasMoreQuestions(currentPage < totalPages);
    } catch (err) {
      setQuestionError(
        err.message || "Could not load questions. Please try again."
      );
    } finally {
      setQuestionsLoading(false);
      setLoadingMoreQuestions(false);
    }
  };

  const openAnswerModal = () => {
    setSelectedQuestion(null);
    setAnswerBody("");
    setAnswerError("");
    setQuestionError("");
    setQuestions([]);
    setAnswerCounts({});
    setQuestionPage(1);
    setHasMoreQuestions(false);
    setIsAnswerModalOpen(true);

    loadQuestionPage(1);
  };

  const loadMoreQuestions = () => {
    if (!loadingMoreQuestions && hasMoreQuestions) {
      loadQuestionPage(questionPage + 1, true);
    }
  };

  const selectQuestion = (question) => {
    setSelectedQuestion(question);
    setAnswerBody("");
    setAnswerError("");
  };

  const handleAnswerSubmit = async (event) => {
    event.preventDefault();

    const questionId = selectedQuestion?._id || selectedQuestion?.id;

    if (!questionId) {
      setAnswerError("Please select a question first.");
      return;
    }

    if (!answerBody.trim()) {
      setAnswerError("Please write an answer before submitting.");
      return;
    }

    setAnswerSubmitting(true);
    setAnswerError("");

    try {
      await submitQuestionAnswer(questionId, answerBody.trim());

      setAnswerCounts((current) => ({
        ...current,
        [questionId]: (current[questionId] || 0) + 1,
      }));

      setAnswerBody("");
      setAnswerError("");

      // Return to the question list after successful submission.
      setSelectedQuestion(null);
    } catch (err) {
      setAnswerError(
        err.message || "Could not submit your answer. Please try again."
      );
    } finally {
      setAnswerSubmitting(false);
    }
  };

  return (
    <>
      {/* CREATE POST CARD */}
      <section className="create-post-card">
        <button
          type="button"
          onClick={openModal}
          className="w-full cursor-pointer rounded-full border border-gray-600 bg-[#16171d] px-4 py-3 text-left text-gray-300 hover:bg-gray-700"
        >
          What do you want to ask or share?
        </button>

        <div className="mt-4 flex items-center justify-center gap-6">
          <button
            type="button"
            onClick={() => {
              // Ask functionality can be added next.
            }}
            className="flex cursor-pointer items-center gap-2 rounded-full px-3 py-1.5 text-white hover:bg-gray-700"
          >
            <FaQuestionCircle className="text-lg" />
            <span>Ask</span>
          </button>

          <button
            type="button"
            onClick={openAnswerModal}
            className="flex cursor-pointer items-center gap-2 rounded-full px-3 py-1.5 text-white hover:bg-gray-700"
          >
            <FaRegPenToSquare className="text-lg" />
            <span>Answer</span>
          </button>

          <button
            type="button"
            onClick={openModal}
            className="flex cursor-pointer items-center gap-2 rounded-full px-3 py-1.5 text-white hover:bg-gray-700"
          >
            <FaPen className="text-lg" />
            <span>Post</span>
          </button>
        </div>
      </section>

      {/* EXISTING CREATE POST MODAL */}
      {isModalOpen && (
        <div
          className="post-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closePostModal();
            }
          }}
        >
          <section
            className="post-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="post-modal-title"
          >
            <header className="post-modal-header">
              <h2 id="post-modal-title">Create a post</h2>

              <button
                type="button"
                className="post-modal-close"
                onClick={closePostModal}
                disabled={loading}
                aria-label="Close modal"
              >
                <X size={21} />
              </button>
            </header>

            <form onSubmit={handleSubmit}>
              <textarea
                className="post-modal-textarea"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Say something...."
                rows={7}
                autoFocus
              />

              {previewUrls.length > 0 && (
                <div className="post-modal-previews">
                  {previewUrls.map((url, index) => (
                    <div className="post-modal-preview" key={url}>
                      <img
                        src={url}
                        alt={`Selected image ${index + 1}`}
                      />

                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        disabled={loading}
                        aria-label={`Remove image ${index + 1}`}
                      >
                        <X size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={handleImageChange}
                disabled={loading}
              />

              {error && (
                <p className="post-modal-error" role="alert">
                  {error}
                </p>
              )}

              <footer className="post-modal-footer">
                <button
                  type="button"
                  className="post-modal-image-button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  aria-label="Select images"
                  title="Add pictures"
                >
                  <ImagePlus size={24} />
                </button>

                <button
                  type="submit"
                  className="post-modal-publish"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <LoaderCircle size={17} />
                      Publishing...
                    </>
                  ) : (
                    "Post"
                  )}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      {/* NEW ANSWER MODAL */}
      {isAnswerModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-3 sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeAnswerModal();
            }
          }}
        >
          <section
            className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-gray-700 bg-[#18191d] text-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="answer-modal-title"
          >
            {/* Modal header */}
            <header className="flex items-center justify-between border-b border-gray-700 px-5 py-4">
              <div className="flex items-center gap-3">
                {selectedQuestion && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!answerSubmitting) {
                        setSelectedQuestion(null);
                        setAnswerBody("");
                        setAnswerError("");
                      }
                    }}
                    disabled={answerSubmitting}
                    className="rounded-full p-2 text-gray-300 hover:bg-gray-700"
                    aria-label="Back to questions"
                  >
                    <ArrowLeft size={20} />
                  </button>
                )}

                <h2
                  id="answer-modal-title"
                  className="text-lg font-semibold"
                >
                  {selectedQuestion ? "Write your answer" : "Answer a question"}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeAnswerModal}
                disabled={answerSubmitting}
                className="rounded-full p-2 text-gray-300 hover:bg-gray-700 disabled:opacity-50"
                aria-label="Close answer modal"
              >
                <X size={22} />
              </button>
            </header>

            <div className="overflow-y-auto p-5">
              {/* QUESTION LIST */}
              {!selectedQuestion && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-400">
                    Choose a question you'd like to answer.
                  </p>

                  {questionsLoading && questions.length === 0 && (
                    <div className="flex items-center justify-center gap-2 py-12 text-gray-300">
                      <LoaderCircle className="animate-spin" size={22} />
                      <span>Loading questions...</span>
                    </div>
                  )}

                  {questionError && (
                    <div
                      className="rounded-xl border border-red-800 bg-red-950/40 p-4 text-sm text-red-300"
                      role="alert"
                    >
                      <p>{questionError}</p>

                      <button
                        type="button"
                        onClick={() => loadQuestionPage(1)}
                        className="mt-3 rounded-full border border-red-700 px-4 py-2 hover:bg-red-900/50"
                      >
                        Try again
                      </button>
                    </div>
                  )}

                  {!questionsLoading &&
                    !questionError &&
                    questions.length === 0 && (
                      <div className="rounded-xl border border-gray-700 px-4 py-10 text-center">
                        <MessageCircle
                          size={32}
                          className="mx-auto mb-3 text-gray-500"
                        />
                        <p className="font-medium">
                          No questions available yet
                        </p>
                        <p className="mt-2 text-sm text-gray-400">
                          Check back later for questions to answer.
                        </p>
                      </div>
                    )}

                  <div className="space-y-3">
                    {questions.map((question, index) => {
                      const id = question._id || question.id;

                      return (
                        <article
                          key={id || index}
                          className="rounded-xl border border-gray-700 p-4 transition hover:border-gray-500 hover:bg-white/[0.03]"
                        >
                          <button
                            type="button"
                            onClick={() => selectQuestion(question)}
                            className="block w-full text-left"
                          >
                            <h3 className="font-semibold leading-6 text-white">
                              {question.title || "Untitled question"}
                            </h3>

                            {question.body && (
                              <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-gray-400">
                                {question.body}
                              </p>
                            )}

                            <div className="mt-3 flex items-center gap-2 text-sm text-gray-400">
                              <MessageCircle size={16} />
                              <span>
                                {answerCounts[id] ?? 0}{" "}
                                {(answerCounts[id] ?? 0) === 1
                                  ? "answer"
                                  : "answers"}
                              </span>
                            </div>
                          </button>

                          <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-700 pt-3">
                            <button
                              type="button"
                              onClick={() => selectQuestion(question)}
                              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-gray-200"
                            >
                              <span className="flex items-center gap-2">
                                <FaRegPenToSquare size={15} />
                                Answer
                              </span>
                            </button>

                            <button
                              type="button"
                              className="rounded-full border border-gray-600 px-4 py-2 text-sm text-gray-200 hover:bg-gray-700"
                            >
                              Follow
                            </button>

                            <button
                              type="button"
                              className="rounded-full border border-gray-600 px-4 py-2 text-sm text-gray-200 hover:bg-gray-700"
                            >
                              Pass
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>

                  {hasMoreQuestions && (
                    <button
                      type="button"
                      onClick={loadMoreQuestions}
                      disabled={loadingMoreQuestions}
                      className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-600 px-4 py-3 text-sm font-medium hover:bg-gray-700 disabled:opacity-50"
                    >
                      {loadingMoreQuestions && (
                        <LoaderCircle size={17} className="animate-spin" />
                      )}
                      {loadingMoreQuestions
                        ? "Loading..."
                        : "Load more questions"}
                    </button>
                  )}
                </div>
              )}

              {/* SELECTED QUESTION AND ANSWER EDITOR */}
              {selectedQuestion && (
                <div className="space-y-5">
                  <article className="rounded-xl border border-gray-700 bg-[#202126] p-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Question
                    </p>

                    <h3 className="text-lg font-semibold leading-7">
                      {selectedQuestion.title || "Untitled question"}
                    </h3>

                    {selectedQuestion.body && (
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-300">
                        {selectedQuestion.body}
                      </p>
                    )}

                    <div className="mt-4 flex items-center gap-2 text-sm text-gray-400">
                      <MessageCircle size={16} />
                      <span>
                        {answerCounts[
                          selectedQuestion._id || selectedQuestion.id
                        ] ?? 0}{" "}
                        answers
                      </span>
                    </div>
                  </article>

                  <form onSubmit={handleAnswerSubmit}>
                    <label
                      htmlFor="answer-body"
                      className="mb-3 flex items-center gap-2 font-semibold"
                    >
                      <FaRegPenToSquare className="text-lg" />
                      Your answer
                    </label>

                    <textarea
                      id="answer-body"
                      value={answerBody}
                      onChange={(event) => setAnswerBody(event.target.value)}
                      placeholder="Write a helpful answer to this question..."
                      rows={7}
                      maxLength={10000}
                      disabled={answerSubmitting}
                      autoFocus
                      className="w-full resize-y rounded-xl border border-gray-600 bg-[#101114] p-4 text-sm leading-6 text-white outline-none placeholder:text-gray-500 focus:border-gray-400 disabled:opacity-60"
                    />

                    <div className="mt-2 flex justify-end text-xs text-gray-500">
                      {answerBody.length}/10000
                    </div>

                    {answerError && (
                      <p
                        className="mt-3 rounded-lg bg-red-950/50 p-3 text-sm text-red-300"
                        role="alert"
                      >
                        {answerError}
                      </p>
                    )}

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-gray-700 pt-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="rounded-full border border-gray-600 px-4 py-2 text-sm hover:bg-gray-700"
                        >
                          Follow
                        </button>

                        <button
                          type="button"
                          className="rounded-full border border-gray-600 px-4 py-2 text-sm hover:bg-gray-700"
                        >
                          Pass
                        </button>
                      </div>

                      <button
                        type="submit"
                        disabled={answerSubmitting || !answerBody.trim()}
                        className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {answerSubmitting ? (
                          <>
                            <LoaderCircle
                              size={17}
                              className="animate-spin"
                            />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Send size={17} />
                            Submit answer
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}


