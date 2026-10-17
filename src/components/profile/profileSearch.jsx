import { FiSearch } from "react-icons/fi";

export default function PostSearch({ value, onChange }) {
  return (
    <div className="relative">
      <FiSearch
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
      />

      <label htmlFor="profile-post-search" className="sr-only">
        Search your posts
      </label>

      <input
        id="profile-post-search"
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search Content"
        className="w-full rounded-lg border border-gray-600 bg-[#16171d] py-3 pl-10 pr-4 text-white placeholder-gray-400 outline-none focus:border-red-600 focus-visible:ring-2 focus-visible:ring-red-600"
      />
    </div>
  );
}
