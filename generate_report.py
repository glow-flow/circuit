import os
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

# Paths to existing uploaded screenshots for visual evidence
IMG_WELCOME = r"C:\Users\ASUS\.gemini\antigravity\brain\7f9848bd-9d6e-419c-ad70-65ed76076cc7\.user_uploaded\media_1793432031273_929732ce.jpg"
IMG_LAB_CIRCUIT = r"C:\Users\ASUS\.gemini\antigravity\brain\7f9848bd-9d6e-419c-ad70-65ed76076cc7\.user_uploaded\media_1793432034448_aea4455d.jpg"
IMG_OUTDOOR_SOLAR = r"C:\Users\ASUS\.gemini\antigravity\brain\7f9848bd-9d6e-419c-ad70-65ed76076cc7\.user_uploaded\media_1793402835912_a61b2af3.jpg"
IMG_OUTDOOR_TOWER = r"C:\Users\ASUS\.gemini\antigravity\brain\7f9848bd-9d6e-419c-ad70-65ed76076cc7\.user_uploaded\media_1793405003649_795a1b85.jpg"
OUTPUT_DOCX_PRIMARY = r"c:\Users\ASUS\Desktop\circuit\Laporan_Inovasi_Circuit_Sandbox_SMPN12_Surabaya_Final.docx"
OUTPUT_DOCX_FALLBACK = r"c:\Users\ASUS\Desktop\circuit\Laporan_Inovasi_Circuit_Sandbox_BRIDA_Surabaya.docx"


def set_cell_background(cell, fill_hex: str):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)


def set_cell_margins(cell, top=90, bottom=90, left=130, right=130):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)


def add_section_banner(doc: Document, number_str: str, title_str: str, subtitle_str: str):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = tbl.cell(0, 0)
    set_cell_background(cell, "0F172A")
    set_cell_margins(cell, top=100, bottom=100, left=160, right=160)

    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(1)
    r_num = p.add_run(f"BAGIAN {number_str}  |  ")
    r_num.bold = True
    r_num.font.name = "Calibri"
    r_num.font.size = Pt(10)
    r_num.font.color.rgb = RGBColor(0x38, 0xBD, 0xF8)

    r_title = p.add_run(title_str.upper())
    r_title.bold = True
    r_title.font.name = "Calibri"
    r_title.font.size = Pt(11.5)
    r_title.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

    p_sub = cell.add_paragraph()
    p_sub.paragraph_format.space_before = Pt(0)
    p_sub.paragraph_format.space_after = Pt(0)
    r_sub = p_sub.add_run(subtitle_str)
    r_sub.italic = True
    r_sub.font.name = "Calibri"
    r_sub.font.size = Pt(9)
    r_sub.font.color.rgb = RGBColor(0xCB, 0xD5, 0xE1)

    p_sp = doc.add_paragraph()
    p_sp.paragraph_format.space_before = Pt(0)
    p_sp.paragraph_format.space_after = Pt(3)


def add_bullet_point(doc: Document, bold_prefix: str, text_body: str):
    p = doc.add_paragraph(style='List Bullet')
    p.paragraph_format.space_before = Pt(1)
    p.paragraph_format.space_after = Pt(2.5)
    p.paragraph_format.line_spacing = 1.12
    r1 = p.add_run(bold_prefix)
    r1.bold = True
    r1.font.name = "Calibri"
    r1.font.size = Pt(10)
    r1.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)

    r2 = p.add_run(text_body)
    r2.font.name = "Calibri"
    r2.font.size = Pt(10)
    r2.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)


def build_report():
    doc = Document()

    # Compact margins so the entire rich report fits cleanly within <= 5 pages
    for section in doc.sections:
        section.top_margin = Inches(0.55)
        section.bottom_margin = Inches(0.55)
        section.left_margin = Inches(0.65)
        section.right_margin = Inches(0.65)

    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Calibri'
    normal_style.font.size = Pt(10)
    normal_style.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)

    # =========================================================================
    # HEADER UTAMA: LAPORAN INOVASI SHOWCASE BRIDA KOTA SURABAYA
    # =========================================================================
    hdr_table = doc.add_table(rows=1, cols=1)
    hdr_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr_cell = hdr_table.cell(0, 0)
    set_cell_background(hdr_cell, "0B1120")
    set_cell_margins(hdr_cell, top=140, bottom=140, left=200, right=200)

    p_badge = hdr_cell.paragraphs[0]
    p_badge.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_badge.paragraph_format.space_after = Pt(3)
    r_badge = p_badge.add_run(
        "DOKUMEN LAPORAN INOVASI  •  SHOWCASE INOVASI BRIDA KOTA SURABAYA"
    )
    r_badge.bold = True
    r_badge.font.size = Pt(9)
    r_badge.font.color.rgb = RGBColor(0x38, 0xBD, 0xF8)

    p_main_title = hdr_cell.add_paragraph()
    p_main_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_main_title.paragraph_format.space_after = Pt(4)
    r_main = p_main_title.add_run(
        "CIRCUIT SANDBOX: LABORATORIUM VIRTUAL RANGKAIAN LISTRIK,\n"
        "PEMBANGKIT ENERGI ALAM & KALKULATOR BIAYA LISTRIK PLN"
    )
    r_main.bold = True
    r_main.font.size = Pt(14)
    r_main.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

    p_tagline = hdr_cell.add_paragraph()
    p_tagline.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_tagline.paragraph_format.space_after = Pt(0)
    r_tag = p_tagline.add_run(
        "Solusi belajar listrik IPA yang seru, aman tanpa takut tersetrum, bisa mencoba Panel Surya & Turbin Angin "
        "di alam terbuka, sekaligus menghitung perkiraan tagihan listrik PLN dalam Rupiah."
    )
    r_tag.italic = True
    r_tag.font.size = Pt(9.5)
    r_tag.font.color.rgb = RGBColor(0xA7, 0xF3, 0xD0)

    p_space = doc.add_paragraph()
    p_space.paragraph_format.space_after = Pt(3)

    # =========================================================================
    # TABEL IDENTITAS INOVASI & TIM PENGEMBANG SMPN 12 SURABAYA
    # =========================================================================
    meta_table = doc.add_table(rows=8, cols=2)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_table.style = 'Table Grid'

    meta_rows = [
        ("Nama Inovasi", "Circuit Sandbox — Laboratorium Fisika Virtual & Simulasi Energi Terbarukan"),
        ("Kategori Showcase", "Inovasi Pendidikan, Sains Terapan & Transisi Energi Hijau (Tingkat SMP)"),
        ("Ketua Tim / Kreator", "KENZIE RAKA ROMERO  (NISN: 0128794397)"),
        ("Asal Sekolah", "SMP Negeri 12 Surabaya"),
        ("Guru Pembimbing", "Ibu Uki"),
        ("Email / Nomor Kontak", "rakaengineer@gmail.com  /  082330395585"),
        (
            "Tim Pengembang &\nKontributor",
            "1. Kenzie Raka Romero — Ketua Tim, Perancang Ide Utama, Pembuat Aset Visual & Pengembang\n"
            "2. Achmad Sandy Pratama — Pencari Bug (Bug Finder) & Penguji Aplikasi (Tester)\n"
            "3. Khaizuran Hamizan Setyawan — Pendamping Desain & Kontributor Dokumentasi Riset\n"
            "4. Muhammad Andhika Parahita — Penguji Rangkaian & Simulasi (Tester)\n"
            "5. Muhammad Syafik Al Rosyid — Penguji Skenario & Kenyamanan Pengguna (Tester)"
        ),
        (
            "Tautan Aplikasi Web",
            "https://circuit-gamma-one.vercel.app  (Langsung dibuka di HP/Laptop tanpa instal aplikasi)"
        ),
    ]

    for idx, (label, val) in enumerate(meta_rows):
        row = meta_table.rows[idx]
        c0, c1 = row.cells[0], row.cells[1]
        c0.width = Inches(1.85)
        c1.width = Inches(5.35)
        set_cell_background(c0, "F1F5F9")
        set_cell_background(c1, "FFFFFF")
        set_cell_margins(c0, top=55, bottom=55, left=100, right=100)
        set_cell_margins(c1, top=55, bottom=55, left=100, right=100)

        p0 = c0.paragraphs[0]
        p0.paragraph_format.space_after = Pt(0)
        r0 = p0.add_run(label)
        r0.bold = True
        r0.font.size = Pt(9.5)
        r0.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)

        p1 = c1.paragraphs[0]
        p1.paragraph_format.space_after = Pt(0)
        r1 = p1.add_run(val)
        r1.font.size = Pt(9.5)
        if "https://" in val or "KENZIE RAKA ROMERO" in val:
            r1.bold = True
            r1.font.color.rgb = RGBColor(0x02, 0x84, 0xC7)
        else:
            r1.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)

    p_space2 = doc.add_paragraph()
    p_space2.paragraph_format.space_after = Pt(4)

    # =========================================================================
    # BAGIAN 1: LATAR BELAKANG & MASALAH UTAMA
    # =========================================================================
    add_section_banner(
        doc,
        "1",
        "Latar Belakang & Masalah Utama",
        "Mengapa inovasi Circuit Sandbox ini dibuat oleh siswa SMPN 12 Surabaya?"
    )

    p_intro = doc.add_paragraph()
    p_intro.paragraph_format.space_after = Pt(4)
    p_intro.paragraph_format.line_spacing = 1.15
    p_intro.add_run(
        "Pelajaran IPA Fisika mengenai Listrik Dinamis, Rangkaian Seri-Paralel, serta Energi Terbarukan merupakan "
        "materi yang sangat penting bagi siswa SMP. Sayangnya, kegiatan praktikum listrik di sekolah maupun di rumah "
        "masih menghadapi empat kendala nyata:"
    )

    add_bullet_point(
        doc,
        "1. Alat Praktikum Mudah Rusak & Berisiko Korsleting: ",
        "Saat siswa belajar menyambung kabel pertama kali, kesalahan posisi kabel sering membuat baterai cepat panas, "
        "bohlam putus terbakar, atau menimbulkan percikan hubung singkat (korsleting)."
    )
    add_bullet_point(
        doc,
        "2. Keterbatasan Jumlah dan Jenis Alat di Sekolah: ",
        "Satu kotak alat praktikum biasanya harus dipakai bergantian oleh banyak siswa. Selain itu, sekolah jarang "
        "memiliki berbagai jenis lampu lengkap (Lampu Pijar, LED, Neon, Halogen, hingga RGB) serta alat ukur digital untuk setiap anak."
    )
    add_bullet_point(
        doc,
        "3. Sulit Mencoba Pembangkit Listrik Tenaga Surya & Angin Secara Langsung: ",
        "Siswa mempelajari teori Panel Surya (PLTS), Turbin Angin (PLTB), dan menara jaringan listrik (SUTET) di buku, "
        "tetapi tidak bisa mempraktikkan langsung bagaimana energi dari alam disalurkan untuk menyalakan lampu di dalam ruangan."
    )
    add_bullet_point(
        doc,
        "4. Siswa Belum Memahami Hubungan Rangkaian Listrik dengan Tagihan Listrik PLN di Rumah: ",
        "Banyak siswa bisa menghitung rumus daya listrik di kertas ujian, tetapi belum terbayang berapa Rupiah biaya "
        "tagihan listrik PLN jika rangkaian lampu tersebut dinyalakan berjam-jam setiap hari di rumah."
    )

    # =========================================================================
    # BAGIAN 2: SOLUSI YANG DITAWARKAN & CARA KERJA SEDERHANA
    # =========================================================================
    add_section_banner(
        doc,
        "2",
        "Solusi yang Ditawarkan & Cara Kerja",
        "Penjelasan sederhana tentang bagaimana Circuit Sandbox menjawab masalah di atas"
    )

    p_sol = doc.add_paragraph()
    p_sol.paragraph_format.space_after = Pt(4)
    p_sol.paragraph_format.line_spacing = 1.15
    r_sol_b = p_sol.add_run("Solusi yang Ditawarkan: ")
    r_sol_b.bold = True
    p_sol.add_run(
        "Kami merancang dan membangun Circuit Sandbox, yaitu aplikasi laboratorium fisika virtual berbasis web yang "
        "bisa dibuka secara gratis melalui HP Android/iOS, tablet, maupun komputer sekolah tanpa perlu menginstal aplikasi tambahan. "
        "Aplikasi ini menggabungkan dua dunia sekaligus: (1) Meja Laboratorium Dalam Ruangan dan (2) Zona Alam Terbuka, "
        "dilengkapi fitur baru Kalkulator Tagihan Listrik PLN (Rupiah)."
    )

    add_bullet_point(
        doc,
        "A. Meja Laboratorium Virtual (Mode Dalam Ruangan): ",
        "Siswa bebas merangkai Baterai AA 1,5V, Baterai 9V, Wadah Baterai, Saklar, Resistor, Voltmeter, Amperemeter, "
        "serta 7 jenis lampu berbeda. Jika lampu cocok dengan rumahnya (lampu ulir ke fiting E27, atau lampu tusuk ke "
        "soket pin), lampu akan menyala dengan terang yang sesuai dengan besarnya arus listrik."
    )
    add_bullet_point(
        doc,
        "B. Zona Alam Terbuka (Simulasi Pembangkit Energi Bersih): ",
        "Dengan menekan tombol 'Keluar ke Alam', layar bertransisi melewati animasi awan menuju lanskap alam terbuka "
        "yang memiliki tanah berumput, bukit, dan sungai. Di sini siswa dapat memasang Panel Surya dan Turbin Angin (0–12V). "
        "Komponen di alam memiliki efek gravitasi (jatuh menapak tanah) dan akan meledak korsleting bila dijatuhkan ke air sungai!"
    )
    add_bullet_point(
        doc,
        "C. Transmisi Jaringan Nyata (Menara Transmisi SUTET di Alam -> Panel Distribusi & MCB di Lab): ",
        "Sesuai standar kelistrikan nyata (PUIL/PLN), listrik dari Panel Surya dan Turbin Angin (dilengkapi Penyearah AC-ke-DC "
        "dan Dioda Penahan Arus Balik) disalurkan lewat Menara Transmisi di alam menuju Panel Distribusi Lab di dalam ruangan "
        "yang dilengkapi layar kWh meter, Trafo Penurun Tegangan (Step-Down DC 3V/6V/9V/12V), serta tuas MCB yang otomatis "
        "memutus aliran (trip) saat terjadi korsleting!"
    )
    add_bullet_point(
        doc,
        "D. Kalkulator Tagihan Listrik PLN (Rupiah) & Penghematan Energi Hijau: ",
        "Setiap kali siswa selesai membuat rangkaian, aplikasi otomatis menghitung daya listrik (Watt), pemakaian energi "
        "(Wh dan kWh), serta perkiraan biaya tagihan listrik PLN dalam Rupiah (per hari, per bulan, dan per tahun) sesuai "
        "golongan tarif resmi PLN (900 VA Subsidi Rp 605/kWh, 900 VA RTM Rp 1.352/kWh, 1.300–2.200 VA Rp 1.444,70/kWh, "
        "hingga 3.500+ VA Rp 1.699,53/kWh). Jika rangkaian disuplai oleh Panel Surya atau Turbin Angin, aplikasi menampilkan "
        "berapa Rupiah tagihan PLN yang berhasil dihemat hingga menjadi Rp 0 (Gratis dari Alam)!"
    )

    p_cara = doc.add_paragraph()
    p_cara.paragraph_format.space_before = Pt(3)
    p_cara.paragraph_format.space_after = Pt(2)
    r_cara = p_cara.add_run("Langkah Penggunaan Aplikasi (Sangat Mudah dalam 5 Langkah):")
    r_cara.bold = True
    r_cara.font.color.rgb = RGBColor(0x02, 0x84, 0xC7)

    steps_text = [
        ("Langkah 1 — Buka & Ikuti Panduan Tur: ",
         "Buka tautan web Circuit Sandbox. Klik 'Mulai Tutorial' untuk mengikuti penunjuk interaktif (tersedia panduan khusus untuk mode Lab maupun mode Alam Terbuka)."),
        ("Langkah 2 — Rangkai Alat di Meja Lab: ",
         "Pilih komponen dari Kotak Komponen (atau pilih Contoh Rangkaian Seri/Paralel), lalu tarik garis kabel antar titik kutub positif (+) dan negatif (-)."),
        ("Langkah 3 — Bangun Pembangkit di Alam Terbuka: ",
         "Klik tombol 'Keluar ke Alam', pasang Panel Surya & Turbin Angin di atas bukit rumput, lalu sambungkan kabelnya ke isolator atas Menara Transmisi."),
        ("Langkah 4 — Cek Rumus & Tagihan Listrik PLN (Rp): ",
         "Buka panel 'Info & Rumus' untuk melihat arus listrik, memilih golongan daya rumah PLN, mengatur jam nyala per hari, dan melihat biaya Rupiah per bulan."),
        ("Langkah 5 — Simpan Karya Rangkaian: ",
         "Klik tombol 'Simpan Rangkaian' di bagian atas agar karya rangkaian tersimpan di memori browser dan bisa ditunjukkan kepada guru kapan saja."),
    ]
    for b_prefix, b_desc in steps_text:
        add_bullet_point(doc, b_prefix, b_desc)

    # Visual Evidence Grid (2x2 Table of Real App Screenshots)
    p_vis_hdr = doc.add_paragraph()
    p_vis_hdr.paragraph_format.space_before = Pt(4)
    p_vis_hdr.paragraph_format.space_after = Pt(3)
    r_vh = p_vis_hdr.add_run("Visual Inovasi (Tangkapan Layar Asli Aplikasi Circuit Sandbox):")
    r_vh.bold = True
    r_vh.font.size = Pt(10)
    r_vh.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)

    img_table = doc.add_table(rows=2, cols=2)
    img_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    img_table.style = 'Table Grid'

    visual_items = [
        (0, 0, IMG_WELCOME,
         "Gambar 1: Tampilan Awal & Panduan Tutorial Interaktif yang ramah bagi siswa baru."),
        (0, 1, IMG_LAB_CIRCUIT,
         "Gambar 2: Simulasi Rangkaian Seri-Paralel 7 Jenis Lampu, Saklar, dan Alat Ukur di Meja Lab."),
        (1, 0, IMG_OUTDOOR_SOLAR,
         "Gambar 3: Zona Alam Terbuka — Pembangkit Panel Surya 12V di atas tanah berumput & air sungai."),
        (1, 1, IMG_OUTDOOR_TOWER,
         "Gambar 4: Menara Transmisi (SUTET) yang mengirimkan listrik bersih dari Alam ke Laboratorium."),
    ]

    for r_i, c_i, img_path, caption in visual_items:
        cell = img_table.rows[r_i].cells[c_i]
        cell.width = Inches(3.6)
        cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
        set_cell_background(cell, "F8FAFC")
        set_cell_margins(cell, top=60, bottom=60, left=80, right=80)
        p_img = cell.paragraphs[0]
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_after = Pt(2)
        if os.path.exists(img_path):
            run_img = p_img.add_run()
            run_img.add_picture(img_path, width=Inches(1.55))
        p_cap = cell.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_after = Pt(0)
        r_cap = p_cap.add_run(caption)
        r_cap.font.size = Pt(8.5)
        r_cap.italic = True
        r_cap.font.color.rgb = RGBColor(0x33, 0x41, 0x55)

    p_sp3 = doc.add_paragraph()
    p_sp3.paragraph_format.space_after = Pt(4)

    # =========================================================================
    # BAGIAN 3: KEUNGGULAN & KEBARUAN INOVASI
    # =========================================================================
    add_section_banner(
        doc,
        "3",
        "Keunggulan & Kebaruan Inovasi",
        "Apa yang membuat Circuit Sandbox berbeda dan lebih unggul dibandingkan simulator lain?"
    )

    comp_table = doc.add_table(rows=6, cols=3)
    comp_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    comp_table.style = 'Table Grid'

    headers = ["Aspek Perbandingan", "Praktikum Fisik / Simulator Lama", "Keunggulan Circuit Sandbox (Inovasi Kami)"]
    for col_i, h_text in enumerate(headers):
        cell = comp_table.rows[0].cells[col_i]
        set_cell_background(cell, "0F172A")
        set_cell_margins(cell, top=70, bottom=70, left=90, right=90)
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        r = p.add_run(h_text)
        r.bold = True
        r.font.size = Pt(9.5)
        r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

    comp_rows = [
        (
            "1. Simulasi Dua Dunia (Lab & Alam Terbuka)",
            "Hanya menampilkan papan rangkaian di satu layar datar tanpa lingkungan alam.",
            "Memiliki 2 dunia interaktif: Meja Lab di dalam ruangan dan Zona Alam Terbuka (bukit, rumput tumbuh, sungai) yang dihubungkan oleh Menara Transmisi."
        ),
        (
            "2. Kalkulator Biaya Listrik PLN (Rupiah)",
            "Hanya menampilkan angka tegangan (V) dan arus (A) tanpa kaitan biaya nyata.",
            "Menghitung konsumsi energi (Wh/kWh) dan estimasi tagihan listrik PLN dalam Rupiah (Rp/hari, Rp/bulan, Rp/tahun) beserta penghematan energi surya/angin."
        ),
        (
            "3. Akurasi Teknik Listrik Nyata (Standar PUIL)",
            "Semua lampu dianggap sama; tidak ada proteksi MCB atau polaritas kutub LED.",
            "Memiliki Panel Distribusi & MCB Lab (auto-trip saat korsleting), Dioda Anti-Arus Balik pada Panel Surya/Turbin, serta aturan kutub Anoda (+)/Katoda (-) pada lampu LED."
        ),
        (
            "4. Fisika Lingkungan & Keamanan Korsleting",
            "Komponen bebas ditaruh di mana saja tanpa reaksi bahaya lingkungan.",
            "Komponen di alam turun mengikuti gravitasi. Jika dijatuhkan ke air sungai atau dari langit terlalu tinggi, muncul animasi ledakan korsleting yang aman."
        ),
        (
            "5. Kemudahan Akses di HP & Panduan Mandiri",
            "Banyak yang berat, berbahasa asing, atau harus menginstal aplikasi di komputer.",
            "100% berbahasa Indonesia & Inggris, ringan di layar sentuh HP maupun laptop, dilengkapi Tutorial Interaktif untuk mode Lab dan mode Alam."
        ),
    ]

    for row_idx, (aspek, konv, unggul) in enumerate(comp_rows, start=1):
        row = comp_table.rows[row_idx]
        vals = [aspek, konv, unggul]
        widths = [Inches(1.6), Inches(2.4), Inches(3.2)]
        bg = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
        for c_i in range(3):
            cell = row.cells[c_i]
            cell.width = widths[c_i]
            set_cell_background(cell, "ECFDF5" if c_i == 2 else bg)
            set_cell_margins(cell, top=55, bottom=55, left=85, right=85)
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.line_spacing = 1.1
            r = p.add_run(vals[c_i])
            r.font.size = Pt(9)
            if c_i == 0:
                r.bold = True
                r.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)
            elif c_i == 2:
                r.bold = True
                r.font.color.rgb = RGBColor(0x06, 0x5F, 0x46)
            else:
                r.font.color.rgb = RGBColor(0x47, 0x55, 0x69)

    p_sp4 = doc.add_paragraph()
    p_sp4.paragraph_format.space_after = Pt(4)

    # =========================================================================
    # BAGIAN 4: DAMPAK, MANFAAT & PENERAPAN NYATA
    # =========================================================================
    add_section_banner(
        doc,
        "4",
        "Dampak, Manfaat & Penerapan Inovasi",
        "Siapa yang terbantu dan apa hasil nyata dari penggunaan Circuit Sandbox?"
    )

    add_bullet_point(
        doc,
        "1. Bagi Siswa SMP/MTs (Khususnya SMPN 12 Surabaya & Sekolah di Kota Surabaya): ",
        "Siswa menjadi jauh lebih antusias belajar IPA karena bisa bereksperimen sendiri dari HP masing-masing kapan saja. "
        "Siswa tidak lagi takut salah menyambung kabel, memahami perbedaan rangkaian seri dan paralel secara visual, "
        "serta tumbuh kesadaran hemat energi karena melihat langsung simulasi biaya tagihan listrik PLN dalam Rupiah."
    )
    add_bullet_point(
        doc,
        "2. Bagi Guru IPA & Sekolah: ",
        "Menghemat biaya pembelian komponen habis pakai (baterai dan bohlam yang sering putus) hingga Rp 0. Guru dapat "
        "menggunakan fitur 'Contoh Rangkaian' di proyektor kelas untuk mendemonstrasikan peristiwa korsleting, pembagi "
        "tegangan, hingga cara kerja pembangkit listrik tenaga surya dan angin hanya dalam hitungan detik."
    )
    add_bullet_point(
        doc,
        "3. Mendukung Program Sekolah Adiwiyata & Kota Surabaya Ramah Lingkungan: ",
        "Melalui simulasi Zona Alam Terbuka dan perhitungan penghematan emisi karbon (CO2), inovasi ini menanamkan "
        "pemahaman sejak dini kepada pelajar Surabaya tentang pentingnya beralih ke energi bersih terbarukan."
    )
    add_bullet_point(
        doc,
        "4. Status Penerapan & Pengujian Saat Ini (Sudah Siap Pakai 100%): ",
        "Aplikasi Circuit Sandbox bukan lagi sekadar konsep, melainkan sudah selesai dibangun secara utuh, telah diuji "
        "coba bersama tim penguji siswa SMPN 12 Surabaya pada perangkat HP Android dan komputer, serta sudah tayang "
        "secara publik di internet (https://circuit-gamma-one.vercel.app) sehingga siap digunakan oleh seluruh sekolah di Surabaya."
    )

    # =========================================================================
    # BAGIAN 5: PENUTUP & PERNYATAAN KEASLIAN KARYA
    # =========================================================================
    add_section_banner(
        doc,
        "5",
        "Penutup & Pernyataan Orisinalitas Karya",
        "Komitmen kejujuran akademik dan rencana pengembangan ke depan"
    )

    p_close = doc.add_paragraph()
    p_close.paragraph_format.space_after = Pt(4)
    p_close.paragraph_format.line_spacing = 1.15
    p_close.add_run(
        "Circuit Sandbox membuktikan bahwa siswa tingkat SMP di Kota Surabaya mampu menghadirkan inovasi teknologi "
        "pendidikan yang kreatif, menyenangkan, dan berdampak langsung bagi teman-teman sebaya. Ke depannya, kami "
        "berencana menambahkan fitur Kuis Tantangan Otomatis untuk Guru serta lebih banyak komponen elektronik rumah tangga.\n"
    )
    r_orig = p_close.add_run(
        "Pernyataan Orisinalitas: Karya inovasi Circuit Sandbox ini dirancang dan dikembangkan secara orisinal oleh "
        "Kenzie Raka Romero bersama Tim Inovasi Siswa SMP Negeri 12 Surabaya di bawah bimbingan Ibu Uki, "
        "tanpa plagiarisme terhadap karya pihak mana pun."
    )
    r_orig.bold = True
    r_orig.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)

    # Signature Block
    sig_table = doc.add_table(rows=1, cols=2)
    sig_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    c_left, c_right = sig_table.rows[0].cells[0], sig_table.rows[0].cells[1]
    c_left.width = Inches(3.6)
    c_right.width = Inches(3.6)

    p_l = c_left.paragraphs[0]
    p_l.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_l.add_run("Mengetahui,\nGuru Pembimbing SMPN 12 Surabaya\n\n\n\n")
    r_l_name = p_l.add_run("( Ibu Uki )")
    r_l_name.bold = True

    p_r = c_right.paragraphs[0]
    p_r.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_r.add_run("Surabaya, 2026\nKetua Tim Inovator\n\n\n\n")
    r_r_name = p_r.add_run("( KENZIE RAKA ROMERO )\n")
    r_r_name.bold = True
    r_r_nisn = p_r.add_run("NISN: 0128794397 • SMPN 12 Surabaya")
    r_r_nisn.font.size = Pt(9)

    doc.save(OUTPUT_DOCX_PRIMARY)
    print(f"Successfully generated: {OUTPUT_DOCX_PRIMARY}")
    try:
        doc.save(OUTPUT_DOCX_FALLBACK)
        print(f"Successfully updated: {OUTPUT_DOCX_FALLBACK}")
    except PermissionError:
        print(f"Note: {OUTPUT_DOCX_FALLBACK} is currently open in MS Word; saved final version to {OUTPUT_DOCX_PRIMARY}")


if __name__ == "__main__":
    build_report()
