import { useEffect, useState } from "react";
import { ArrowBigUp, ArrowBigDown } from "lucide-react";
import {
  getVoteSummary,
  castVote,
} from "../services/voteService";

const emptySummary = {
  upvotes: 0,
  downvotes: 0,
  score: 0,
  userVote: 0,
};

// 2300 -> "2.3K", 1000000 -> "1M"
function formatCount(value) {
  const n = Number(value) || 0;

  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  }

  if (n >= 1000) {
    return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  }

  return String(n);
}

export default function VoteButtons({ targetType, targetId }) {
  const [summary, setSummary] = useState(emptySummary);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadSummary = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await getVoteSummary(targetType, targetId);

        if (active) {
          setSummary({ ...emptySummary, ...data });
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
              "Could not load vote counts."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadSummary();

    return () => {
      active = false;
    };
  }, [targetType, targetId]);

  const handleVote = async (value) => {
    if (voting) return;

    setVoting(true);
    setError("");

    try {
      const updatedSummary = await castVote(
        targetType,
        targetId,
        value
      );

      setSummary({ ...emptySummary, ...updatedSummary });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not record your vote. Please sign in and try again."
      );
    } finally {
      setVoting(false);
    }
  };

  const upActive = summary.userVote === 1;
  const downActive = summary.userVote === -1;

  return (
    <div className="vote-container">
      <div className="vote-pill">
        <button
          type="button"
          className={`vote-pill-btn vote-pill-up ${
            upActive ? "active" : ""
          }`}
          onClick={() => handleVote(1)}
          disabled={loading || voting}
          aria-label="Upvote"
          aria-pressed={upActive}
          title={`Upvote (${summary.upvotes})`}
        >
          <ArrowBigUp
            size={22}
            fill={upActive ? "currentColor" : "none"}
          />
          <span className="vote-pill-label">Upvote</span>
          {summary.upvotes > 0 && (
            <span className="vote-pill-count">
              · {formatCount(summary.upvotes)}
            </span>
          )}
        </button>

        <span className="vote-pill-divider" aria-hidden="true" />

        <button
          type="button"
          className={`vote-pill-btn vote-pill-down ${
            downActive ? "active" : ""
          }`}
          onClick={() => handleVote(-1)}
          disabled={loading || voting}
          aria-label="Downvote"
          aria-pressed={downActive}
          title={`Downvote (${summary.downvotes})`}
        >
          <ArrowBigDown
            size={22}
            fill={downActive ? "currentColor" : "none"}
          />
        </button>
      </div>

      {error && (
        <p className="vote-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
