import {
    FaPlus,
    FaSquareRootAlt,
    FaHeartbeat,
    FaAtom,
    FaFileAlt,
    FaCar,
    FaRadiation,
} from "react-icons/fa";

// Display-only data. Nothing in this sidebar is clickable.
const SPACES = [
    { lines: ["Mathematics"], icon: FaSquareRootAlt, tile: "qf-tile-math", dot: true },
    { lines: ["Health"], icon: FaHeartbeat, tile: "qf-tile-health", dot: true },
    { lines: ["Physics"], icon: FaAtom, tile: "qf-tile-physics", dot: true },
    { lines: ["American Civ", "War and…"], icon: FaFileAlt, tile: "qf-tile-doc" },
    { lines: ["Women's", "Personal…"], icon: FaFileAlt, tile: "qf-tile-doc" },
    { lines: ["Classic Cars"], icon: FaCar, tile: "qf-tile-cars" },
    { lines: ["Atomic", "Bombs"], icon: FaRadiation, tile: "qf-tile-atomic" },
    { lines: ["Body Hair", "Removal"], icon: FaFileAlt, tile: "qf-tile-doc" },
];

const FOOTER_LINKS = [
    ["About Quora"],
    ["Terms"],
    ["Privacy"],
    ["Acceptable Use"],
    ["Advertise"],
    ["Your Ad", "Choices"],
    ["Careers"],
];

export default function FeedSidebar() {
    return (
        <aside className="qf-left" aria-label="Spaces">
            <div className="qf-create">
                <FaPlus className="qf-create-plus" aria-hidden="true" />
                <span className="qf-label">
                    <span>Create</span>
                    <span>Space</span>
                </span>
            </div>

            <ul className="qf-spaces">
                {SPACES.map(({ lines, icon: Icon, tile, dot }) => (
                    <li className="qf-space" key={lines.join(" ")}>
                        <span className={`qf-tile ${tile}`} aria-hidden="true">
                            <Icon />
                            {dot && <i className="qf-dot" />}
                        </span>
                        <span className="qf-label">
                            {lines.map((line) => (
                                <span key={line}>{line}</span>
                            ))}
                        </span>
                    </li>
                ))}
            </ul>

            <hr className="qf-divider" />

            <ul className="qf-footer">
                {FOOTER_LINKS.map((lines) => (
                    <li key={lines.join(" ")}>
                        {lines.map((line) => (
                            <span key={line}>{line}</span>
                        ))}
                    </li>
                ))}
            </ul>
        </aside>
    );
}