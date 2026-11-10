import React, { useState } from 'react';
import { Search, ShieldCheck, Tag, Calendar, ArrowLeft, Quote } from 'lucide-react';
import { CulturalArticle } from '../types';
import { HoaSenMotif } from './VietnamFolkMotifs';
import { HeritageImage } from './HeritageImage';

interface KnowledgeRepoProps {
  articles: CulturalArticle[];
  selectedArticle: CulturalArticle | null;
  onSelectArticle: (article: CulturalArticle | null) => void;
}

export const KnowledgeRepo: React.FC<KnowledgeRepoProps> = ({
  articles,
  selectedArticle,
  onSelectArticle,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('all');

  const topics = Array.from(new Set(articles.map((a) => a.topic)));

  const filteredArticles = articles.filter((art) => {
    if (selectedTopic !== 'all' && art.topic !== selectedTopic) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const match =
        art.title.toLowerCase().includes(q) ||
        art.excerpt.toLowerCase().includes(q) ||
        art.author.toLowerCase().includes(q) ||
        art.tags.some((t) => t.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  // If viewing a specific article
  if (selectedArticle) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-[fadeIn_0.2s_ease-out]">
        <button
          onClick={() => onSelectArticle(null)}
          className="text-xs font-semibold text-[#795548] hover:text-[#B8322A] flex items-center gap-1.5 cursor-pointer bg-[#FAF6EF] px-3 py-1.5 rounded-md border border-[#D8A84E]/40"
        >
          <ArrowLeft size={14} />
          <span>Quay lại kho tri thức</span>
        </button>

        {/* Article Header */}
        <header className="space-y-4 border-b border-[#D8A84E]/40 pb-6">
          <div className="flex items-center gap-2 text-xs text-[#795548]">
            <span className="font-semibold text-[#B8322A] uppercase tracking-wider">{selectedArticle.topic}</span>
            <span aria-hidden="true">·</span>
            <span>{selectedArticle.read_time} đọc</span>
            <span aria-hidden="true">·</span>
            <span className="text-[#397C73] font-medium flex items-center gap-1">
              <ShieldCheck size={13} /> Tư liệu có nguồn kiểm chứng
            </span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#28231F] leading-tight text-balance">
            {selectedArticle.title}
          </h1>

          <p className="font-serif italic text-base sm:text-lg text-[#795548]">
            {selectedArticle.subtitle}
          </p>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#795548] pt-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#B8322A]/10 text-[#B8322A] flex items-center justify-center font-bold font-serif">
                {selectedArticle.author.charAt(0)}
              </div>
              <div>
                <span className="font-bold text-[#28231F] block">{selectedArticle.author}</span>
                <span className="text-[11px] text-[#795548]">{selectedArticle.author_title}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px]">
              <Calendar size={13} />
              <span>Cập nhật: {selectedArticle.published_date}</span>
            </div>
          </div>
        </header>

        {/* Featured Cover Image */}
        {selectedArticle.cover_image && (
          <div className="rounded-xl overflow-hidden border border-[#D8A84E]/40 bg-[#EBDDCA]">
            <HeritageImage
              src={selectedArticle.cover_image.image_url}
              alt={selectedArticle.title}
              className="w-full aspect-16/9 object-cover"
            />
            <div className="p-3 text-[11px] text-[#795548] bg-[#FAF6EF] border-t border-[#D8A84E]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <span>{selectedArticle.cover_image.caption || selectedArticle.title}</span>
              <span className="text-[10px] text-[#397C73]">
                Nguồn: {selectedArticle.cover_image.source_name} ({selectedArticle.cover_image.license_type})
              </span>
            </div>
          </div>
        )}

        {/* Article Body Sections */}
        <main className="space-y-6 text-[#28231F] leading-relaxed text-sm sm:text-base font-sans">
          {selectedArticle.sections.map((sec, idx) => (
            <section key={idx} className="space-y-3">
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#28231F] pt-2">
                {sec.heading}
              </h2>

              <p className="whitespace-pre-line text-[#28231F]/90 leading-relaxed">
                {sec.body}
              </p>

              {sec.quote && (
                <div className="my-4 p-4 border-l-2 border-[#B8322A] bg-[#FAF6EF] rounded-r-lg italic font-serif text-[#795548]">
                  <Quote size={16} className="text-[#B8322A] mb-1 opacity-70" />
                  <p>{sec.quote}</p>
                </div>
              )}
            </section>
          ))}
        </main>

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-1.5 pt-4 border-t border-[#D8A84E]/30">
          <Tag size={13} className="text-[#795548] mr-1" />
          {selectedArticle.tags.map((t, i) => (
            <span key={i} className="text-xs bg-[#EBDDCA]/60 text-[#795548] px-2.5 py-1 rounded">
              #{t}
            </span>
          ))}
        </div>

        {/* Source Citations */}
        <footer className="p-4 sm:p-5 bg-[#FAF6EF] border border-[#D8A84E]/50 rounded-xl space-y-3 text-xs">
          <div className="flex items-center gap-2 text-[#28231F] font-bold">
            <ShieldCheck size={16} className="text-[#397C73]" />
            <span>Danh Mục Nguồn Tham Khảo & Cơ Sở Tư Liệu</span>
          </div>
          <p className="text-[11px] text-[#795548]">
            Các thông tin văn hóa, lịch sử và dân tộc học trong bài viết đều được dẫn xuất từ công trình nghiên cứu và văn bản di sản đã qua kiểm định:
          </p>
          <ul className="space-y-1.5 list-disc list-inside text-[#28231F]/90 pl-1">
            {selectedArticle.source_citations.map((cite, i) => (
              <li key={i} className="leading-relaxed">
                <strong>{cite.source_name}</strong>{' '}
                <span className="text-[10px] text-[#795548]">[{cite.type.toUpperCase()}]</span>
              </li>
            ))}
          </ul>
        </footer>
      </div>
    );
  }

  // Articles List View
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-[#D8A84E]/30 pb-4 space-y-2">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#B8322A] font-bold">
          <HoaSenMotif size={16} />
          <span>KHO TRI THỨC VĂN HÓA & KHẢO CỨU BẢN ĐỊA</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#28231F]">
          Tư Liệu & Bản Sắc Di Sản Đông Nam Bộ
        </h1>
        <p className="text-xs sm:text-sm text-[#795548] max-w-2xl">
          Nơi lưu trữ các nghiên cứu chuyên sâu về lịch sử, nghệ thuật dân gian, tôn giáo, tín ngưỡng và văn hóa các tộc người với nguồn trích dẫn kiểm chứng.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#FAF6EF] p-3 rounded-xl border border-[#D8A84E]/40">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3 top-2.5 text-[#795548]" />
          <input
            type="text"
            placeholder="Tìm theo chủ đề, tác giả, từ khóa di sản..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F4EBDD] border border-[#D8A84E]/50 rounded-lg text-[#28231F] focus:outline-none focus:ring-1 focus:ring-[#B8322A]"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 text-xs">
          <button
            onClick={() => setSelectedTopic('all')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              selectedTopic === 'all'
                ? 'bg-[#B8322A] text-white font-medium'
                : 'bg-[#F4EBDD] text-[#795548] hover:text-[#28231F]'
            }`}
          >
            Tất Cả Chủ Đề
          </button>
          {topics.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTopic(t)}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                selectedTopic === t
                  ? 'bg-[#B8322A] text-white font-medium'
                  : 'bg-[#F4EBDD] text-[#795548] hover:text-[#28231F]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredArticles.map((article) => (
          <article
            key={article.id}
            onClick={() => onSelectArticle(article)}
            className="group bg-[#FAF6EF] border border-[#D8A84E]/40 rounded-xl overflow-hidden hover:border-[#B8322A] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="relative aspect-16/10 overflow-hidden bg-[#EBDDCA]">
                <HeritageImage
                  src={article.cover_image?.image_url}
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-2 left-2 text-[10px] font-semibold bg-[#FAF6EF]/90 text-[#B8322A] px-2 py-0.5 rounded backdrop-blur-xs">
                  {article.topic}
                </span>
              </div>

              <div className="p-4 space-y-2">
                <span className="text-[10px] text-[#795548]">{article.read_time} đọc · {article.region_name}</span>
                <h3 className="font-serif font-bold text-base text-[#28231F] group-hover:text-[#B8322A] transition-colors line-clamp-2">
                  {article.title}
                </h3>
                <p className="text-xs text-[#795548] line-clamp-3 leading-relaxed">
                  {article.excerpt}
                </p>
              </div>
            </div>

            <div className="p-4 pt-2 border-t border-[#D8A84E]/20 text-[11px] text-[#795548] flex items-center justify-between">
              <span>{article.author}</span>
              <span className="text-[#397C73] font-medium flex items-center gap-1">
                <ShieldCheck size={12} /> Đã kiểm chứng
              </span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};