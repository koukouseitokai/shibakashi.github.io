/* js/site.js
 * 全ページ共通のJavaScript機能
 * HuiFontP29フォント読み込み制御、モバイルメニュー、ヘッダーアニメーションを管理
 * RELEVANT FILES: index.html, css/style.css, css/top.css
 */

(() => {
  /* ========================================
     フォント読み込み制御
     Font Loading APIを使用してWebフォントの読み込み状態を管理
     FOIT（Flash of Invisible Text）による表示制御を実装
     ======================================== */
  const root = document.documentElement;
  // フォントが既に読み込まれていない場合のみ処理
  if (root && !root.classList.contains("font-hui-ready")) {
    // Font Loading APIが利用可能な場合は非同期読み込み
    if (document.fonts && typeof document.fonts.load === "function") {
      // フォント読み込み完了時にクラスを追加する関数
      const markReady = () => root.classList.add("font-hui-ready");

      // HuiFontP29フォントの読み込みを明示的に実行
      // 600はフォントウェイト、1emはサイズ指定
      document.fonts
        .load("600 1em 'HuiFontP29'")
        .then(() => markReady())
        .catch(() => markReady()); // エラー時も表示を有効化

      // フェイルセーフ：3.5秒後に強制的にフォントを表示
      // Promiseが永久に解決されない場合の保険
      window.setTimeout(() => {
        if (!root.classList.contains("font-hui-ready")) {
          markReady();
        }
      }, 3500);
    } else {
      // Font Loading APIが利用不可な古いブラウザでは即座に表示
      root.classList.add("font-hui-ready");
    }
  }

  /* ========================================
     モバイルメニューの初期化
     要素の取得と設定値の定義
     ======================================== */
  const menu = document.getElementById("mobile-menu");
  const toggleButton = document.querySelector("[data-menu-toggle]");
  // 必要な要素が存在しない場合は処理を中断
  if (!menu || !toggleButton) return;

  // メニュー内の各要素を取得
  const closeButton = menu.querySelector("[data-menu-close]"); // 閉じるボタン
  const overlay = menu.querySelector("[data-menu-overlay]"); // 背景のオーバーレイ

  // フォーカス可能な要素のセレクター（アクセシビリティ対応）
  const focusSelector = "a[href], button:not([disabled])";

  // 状態管理用の変数
  let lastFocused = null; // メニューを開く前のフォーカス要素を記憶
  let closeTimeout = null; // メニュー閉じるアニメーション用タイマー
  let transitionEndHandler = null; // transitionendイベントハンドラーの参照

  // ヘッダー要素とスクロール判定の閾値
  const siteHeader = document.querySelector(".site-header");
  const headerObserverOffset = 40; // 40px以上スクロールでヘッダー固定

  /* ========================================
     ユーティリティ関数
     ======================================== */
  // メニュー内のフォーカス可能な要素を取得
  const getFocusable = () => menu.querySelectorAll(focusSelector);

  // ペンディング中のメニュー閉じる処理をクリア
  const clearPendingClose = () => {
    // タイマーが設定されている場合はクリア
    if (closeTimeout) {
      clearTimeout(closeTimeout);
      closeTimeout = null;
    }
    // transitionendイベントリスナーが設定されている場合は削除
    if (transitionEndHandler) {
      menu.removeEventListener("transitionend", transitionEndHandler);
      transitionEndHandler = null;
    }
  };

  // メニューを完全に非表示にする最終処理
  const finalizeMenuClose = () => {
    menu.classList.add("hidden"); // display: none を適用
    menu.setAttribute("aria-hidden", "true"); // スクリーンリーダー用
    clearPendingClose(); // クリーンアップ
  };

  /* ========================================
     メニューを開く処理
     アニメーションとアクセシビリティ対応を含む
     ======================================== */
  function openMenu() {
    // 既に開いている場合は何もしない
    if (!menu.classList.contains("hidden")) return;

    // ペンディング中の閉じる処理をクリア
    clearPendingClose();

    // 現在のフォーカス要素を記憶（メニューを閉じる時に戻すため）
    lastFocused = document.activeElement;

    // メニューを表示状態にする
    menu.classList.remove("hidden");
    menu.setAttribute("aria-hidden", "false");
    toggleButton.setAttribute("aria-expanded", "true");

    // ページのスクロールを無効化
    document.body.classList.add("overflow-hidden");
    root.classList.add("menu-open");

    // ヘッダーの位置を固定
    if (siteHeader) {
      siteHeader.style.transform = "translateY(0)";
    }

    // 次のフレームでアニメーション用クラスを追加（CSSトランジション発動用）
    requestAnimationFrame(() => {
      menu.classList.add("is-open");
    });

    // メニュー内の最初のフォーカス可能要素にフォーカスを移動
    const focusables = getFocusable();
    if (focusables.length) {
      focusables[0].focus();
    }

    // キーボードイベントリスナーを追加（ESCキーやTabキー処理用）
    document.addEventListener("keydown", handleKeydown);
  }

  /* ========================================
     メニューを閉じる処理
     アニメーション完了後にDOMから完全に非表示化
     ======================================== */
  function closeMenu(returnFocus = true) {
    // 既に閉じている場合は何もしない
    if (menu.classList.contains("hidden") && !menu.classList.contains("is-open")) return;

    // ペンディング中の閉じる処理をクリア
    clearPendingClose();

    // メニューを閉じるアニメーションを開始
    menu.classList.remove("is-open");
    menu.setAttribute("aria-hidden", "true");
    toggleButton.setAttribute("aria-expanded", "false");

    // ページのスクロールを有効化
    document.body.classList.remove("overflow-hidden");
    root.classList.remove("menu-open");

    // ヘッダーの状態を更新（スクロール位置に応じて）
    if (siteHeader) {
      if (window.scrollY <= headerObserverOffset) {
        // ページトップ付近の場合はヘッダー固定を解除
        siteHeader.classList.remove("is-fixed");
        siteHeader.style.transform = "translateY(0)";
      }
    }

    // キーボードイベントリスナーを削除
    document.removeEventListener("keydown", handleKeydown);

    // CSSトランジション完了時にメニューを完全に非表示にする
    transitionEndHandler = (event) => {
      // イベントがメニュー本体からのものでない場合は無視
      if (event.target !== menu) return;
      finalizeMenuClose();
    };

    menu.addEventListener("transitionend", transitionEndHandler);

    // フェイルセーフ：400ms後に強制的に非表示（transitionendが発火しない場合）
    closeTimeout = window.setTimeout(finalizeMenuClose, 400);

    // フォーカスを元の要素に戻す（アクセシビリティ対応）
    if (returnFocus && lastFocused instanceof HTMLElement) {
      lastFocused.focus();
    }
  }

  /* ========================================
     キーボード操作の処理
     ESCキーでメニューを閉じる、Tabキーでフォーカストラップ
     ======================================== */
  function handleKeydown(event) {
    // ESCキーが押された場合はメニューを閉じる
    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu();
      return;
    }

    // Tabキーが押された場合はフォーカストラップを実行
    if (event.key === "Tab") {
      trapFocus(event);
    }
  }

  /* ========================================
     フォーカストラップ機能
     メニュー内でTabキーによるフォーカス移動を循環させる
     アクセシビリティ対応：メニュー外にフォーカスが出ないようにする
     ======================================== */
  function trapFocus(event) {
    // メニュー内のフォーカス可能な要素を取得
    const focusables = getFocusable();
    if (!focusables.length) return;

    // 最初と最後の要素を取得
    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    // Shift+Tabで最初の要素から前に移動しようとした場合
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus(); // 最後の要素にフォーカスを移動
    }
    // Tabで最後の要素から次に移動しようとした場合
    else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus(); // 最初の要素にフォーカスを移動
    }
  }

  /* ========================================
     イベントリスナーの設定
     各種ボタンとオーバーレイのクリックイベントを管理
     ======================================== */
  // ハンバーガーメニューボタンのクリック処理
  toggleButton.addEventListener("click", () => {
    const expanded = toggleButton.getAttribute("aria-expanded") === "true";
    if (expanded) {
      closeMenu(); // 既に開いている場合は閉じる
    } else {
      openMenu(); // 閉じている場合は開く
    }
  });

  // オーバーレイクリックでメニューを閉じる
  overlay?.addEventListener("click", () => closeMenu());

  // 閉じるボタンクリックでメニューを閉じる
  closeButton?.addEventListener("click", () => closeMenu());

  // メニュー内のリンククリック時にメニューを閉じる
  // returnFocus=falseで元の要素にフォーカスを戻さない（ページ遷移のため）
  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => closeMenu(false));
  });

  /* ========================================
     ヘッダーのスクロール制御（index.html専用）
     スクロール量に応じてヘッダーの固定表示を切り替え
     ======================================== */
  if (siteHeader) {
    const handleScroll = () => {
      // 40px以上スクロールした場合
      if (window.scrollY > headerObserverOffset) {
        // まだ固定されていない場合のみアニメーション実行
        if (!siteHeader.classList.contains("is-fixed")) {
          // 一旦上に移動させてから
          siteHeader.style.transform = "translateY(-100%)";
          siteHeader.classList.add("is-fixed");

          // 次のフレームでスライドダウンアニメーション
          requestAnimationFrame(() => {
            siteHeader.style.transform = "translateY(0)";
          });
        }
      } else {
        // ページトップ付近では固定を解除
        if (siteHeader.classList.contains("is-fixed")) {
          siteHeader.classList.remove("is-fixed");
        }
        siteHeader.style.transform = "translateY(0)";
      }
    };

    // 初期状態をチェック
    handleScroll();

    // スクロールイベントリスナーを追加（passive: trueでパフォーマンス最適化）
    window.addEventListener("scroll", handleScroll, { passive: true });
  }
  /* ========================================
     スムーズスクロール機能
     内部アンカーリンクのクリック時に滑らかにスクロール
     全ページ共通で使用可能
     ======================================== */
  document.addEventListener("DOMContentLoaded", function () {
    // ページ内アンカーリンク（#で始まるリンク）を取得
    const anchorLinks = document.querySelectorAll('a[href^="#"]');

    anchorLinks.forEach((link) => {
      link.addEventListener("click", function (e) {
        const targetId = this.getAttribute("href");

        // #のみの場合（ページトップへのリンク）は処理をスキップ
        if (targetId === "#") return;

        const targetElement = document.querySelector(targetId);

        // ターゲット要素が存在する場合のみスムーズスクロール
        if (targetElement) {
          e.preventDefault(); // デフォルトの瞬間移動を防止

          // 固定ヘッダーの高さを考慮したオフセット
          const headerHeight = 80; // ヘッダーの高さ（px）
          const targetPosition = targetElement.offsetTop - headerHeight;

          // スムーズスクロールアニメーション実行
          window.scrollTo({
            top: targetPosition,
            behavior: "smooth", // 滑らかなスクロール動作
          });
        }
      });
    });
  });

  /* ========================================
     ページトップへ戻るボタン
     スクロール時に表示され、クリックでページ最上部へ
     全ページ共通で右下に固定表示
     ======================================== */
  document.addEventListener("DOMContentLoaded", function () {
    // ボタン要素を動的に作成
    const scrollTopButton = document.createElement("button");
    scrollTopButton.setAttribute("aria-label", "ページトップへ戻る");
    scrollTopButton.className = "scroll-to-top-btn";
    scrollTopButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 19V5"></path>
        <path d="M5 12L12 5L19 12"></path>
      </svg>
    `;

    // スタイルを動的に追加
    const style = document.createElement("style");
    style.textContent = `
      .scroll-to-top-btn {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background-color: rgb(8 145 178);  /* cyan-600 */
        color: white;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease, visibility 0.3s ease, background-color 0.2s ease, transform 0.2s ease;
        z-index: 40;
        box-shadow: 0 10px 25px rgba(8, 145, 178, 0.3);
      }

      .scroll-to-top-btn:hover {
        background-color: rgb(14 116 144);  /* cyan-700 */
        transform: translateY(-2px);
        box-shadow: 0 12px 30px rgba(8, 145, 178, 0.4);
      }

      .scroll-to-top-btn:active {
        transform: translateY(0);
      }

      .scroll-to-top-btn.visible {
        opacity: 1;
        visibility: visible;
      }

      @media (max-width: 640px) {
        .scroll-to-top-btn {
          width: 44px;
          height: 44px;
          bottom: 16px;
          right: 16px;
        }
      }
    `;

    // DOMに追加
    document.head.appendChild(style);
    document.body.appendChild(scrollTopButton);

    // スクロール時の表示/非表示制御
    let scrollTimeout;
    const handleScrollVisibility = () => {
      // タイマーをクリア
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }

      // 300px以上スクロールした場合に表示
      if (window.scrollY > 300) {
        scrollTopButton.classList.add("visible");
      } else {
        scrollTopButton.classList.remove("visible");
      }

      // スクロール停止後にチェック（パフォーマンス最適化）
      scrollTimeout = setTimeout(() => {
        if (window.scrollY > 300) {
          scrollTopButton.classList.add("visible");
        } else {
          scrollTopButton.classList.remove("visible");
        }
      }, 100);
    };

    // 初期状態をチェック
    handleScrollVisibility();

    // スクロールイベントリスナー
    window.addEventListener("scroll", handleScrollVisibility, { passive: true });

    // ボタンクリック時の動作
    scrollTopButton.addEventListener("click", () => {
      // ページトップへスムーズスクロール
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });
  });

  /* ========================================
     アコーディオンアニメーション
     details要素の開閉にスムーズなアニメーションを追加
     対象：部活動リストなどのdetails要素
     ======================================== */
  document.addEventListener("DOMContentLoaded", function () {
    // すべてのdetails要素を取得
    const allDetails = document.querySelectorAll("details");

    allDetails.forEach((details) => {
      const summary = details.querySelector("summary");
      const content = details.querySelector("summary ~ div");

      if (!summary || !content) return;

      // コンテンツにトランジション用のスタイルを追加
      content.style.overflow = "hidden";
      content.style.transition = "max-height 0.3s ease-in-out, opacity 0.3s ease-in-out";

      // 初期状態を設定
      if (details.open) {
        content.style.maxHeight = content.scrollHeight + "px";
        content.style.opacity = "1";
      } else {
        content.style.maxHeight = "0px";
        content.style.opacity = "0";
      }

      // summaryクリック時の処理
      summary.addEventListener("click", (e) => {
        e.preventDefault();

        if (details.open) {
          // 閉じる時のアニメーション
          // 現在の高さを取得して設定（max-heightがnoneの場合に対応）
          const currentHeight = content.scrollHeight;
          content.style.maxHeight = currentHeight + "px";

          // リフローを強制してから0にアニメーション
          content.offsetHeight;
          content.style.maxHeight = "0px";
          content.style.opacity = "0";

          // アニメーション完了後にdetailsを閉じる
          setTimeout(() => {
            details.open = false;
          }, 300);
        } else {
          // 開く時のアニメーション
          details.open = true;

          // 次のフレームで高さを設定（アニメーションを確実に実行）
          requestAnimationFrame(() => {
            content.style.maxHeight = content.scrollHeight + "px";
            content.style.opacity = "1";
          });
        }
      });

      // details要素の開閉状態が変更されたときの処理（ブラウザのデフォルト動作対応）
      details.addEventListener("toggle", (e) => {
        if (!e.target.open && content.style.maxHeight !== "0px") {
          content.style.maxHeight = "0px";
          content.style.opacity = "0";
        }
      });

      // ウィンドウリサイズ時に高さを再計算
      window.addEventListener("resize", () => {
        if (details.open) {
          content.style.maxHeight = content.scrollHeight + "px";
        }
      });
    });
  });
})(); // 即時実行関数の終了

/* ========================================
   施設カードフリップ機能
   クリック/タップで写真と説明文を切り替え
   対象：facilities.htmlの施設カード
   ======================================== */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    // 施設カードフリップ機能の初期化
    const flipCards = document.querySelectorAll(".flip-card");

    if (!flipCards.length) return; // カードがない場合は処理しない

    flipCards.forEach((card) => {
      // カード内のクリック可能な要素を取得
      const clickableElements = card.querySelectorAll(".flip-card-front, .flip-card-back");

      clickableElements.forEach((element) => {
        element.addEventListener("click", (e) => {
          e.preventDefault();
          // フリップ状態をトグル
          card.classList.toggle("flipped");
        });
      });

      // タッチイベントのサポート（モバイル対応）
      let touchStartY = 0;

      card.addEventListener(
        "touchstart",
        (e) => {
          // タッチ開始位置を記録
          touchStartY = e.touches[0].clientY;
        },
        { passive: true }
      );

      card.addEventListener("touchend", (e) => {
        const touchEndY = e.changedTouches[0].clientY;

        // スクロールではなくタップの場合のみフリップ（10px以内の動きならタップと判定）
        if (Math.abs(touchEndY - touchStartY) < 10) {
          e.preventDefault();
          card.classList.toggle("flipped");
        }
      });

      // キーボード操作対応（アクセシビリティ）
      const frontCard = card.querySelector(".flip-card-front");
      const backCard = card.querySelector(".flip-card-back");

      // tabindex追加でキーボードフォーカス可能に
      if (frontCard) frontCard.setAttribute("tabindex", "0");
      if (backCard) backCard.setAttribute("tabindex", "0");

      // Enterキーでもフリップできるように
      [frontCard, backCard].forEach((element) => {
        if (element) {
          element.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              card.classList.toggle("flipped");
            }
          });
        }
      });
    });
  });
})(); // 施設カードフリップ機能の終了

// Quiz data
const questions = [
    {
        question: "芝柏の学食のメニューは何種類？",
        choices: ["2種類", "3種類", "4種類"],
        correct: 2,
        explanation: "学食では、カレー、から揚げ、麺類(日替わり)、アラカルト(日替わり)を食べることができます。"
    },
    {
        question: "芝浦工業大学柏高等学校は何年に作られた？",
        choices: ["1960年", "1980年", "2000年"],
        correct: 1,
        explanation: "芝浦工業大学柏高等学校は1980年に創立しました。2030年には創立50周年を迎えます。"
    },
    {
        question: "芝柏のキャラクターの名前は？",
        choices: ["かしわばー", "しばかっしー", "しばもーり"],
        correct: 1,
        explanation: "しばかしのキャラクターはしばかっしーです。かわいいですね。"
    },
    {
        question: "芝柏に通う生徒数は？",
        choices: ["820名", "1160名", "1440名"],
        correct: 2,
        explanation: "芝柏には中学校15クラス540名、高校23クラス900名で合計1440名の生徒がいます。"
    },
    {
        question: "芝柏に入ると科学分野でどのようなことができるか？",
        choices: ["様々な科学イベントに参加できる", "科学は夏休みしか勉強できない", "科学に関する部活はない"],
        correct: 0,
        explanation: "芝柏はSSH指定校です。すべての生徒が探求活動をしています。また、芝柏にはまた芝柏に入れば様々な科学イベントに参加することができます。"
    }
];

// Game state
let currentQuestion = 0;
let selectedAnswer = null;
let showResult = false;
let userAnswers = [];
let score = 0;

// DOM elements
const elements = {
    questionScreen: document.getElementById('questionScreen'),
    completionScreen: document.getElementById('completionScreen'),
    resultScreen: document.getElementById('resultScreen'),
    resultsPage: document.getElementById('resultsPage'),
    progress: document.getElementById('progress'),
    question: document.getElementById('question'),
    dimmedQuestion: document.getElementById('dimmedQuestion'),
    resultMark: document.getElementById('resultMark'),
    answerLine: document.getElementById('answerLine'),
    correctLine: document.getElementById('correctLine'),
    explanationText: document.getElementById('explanationText'),
    finalScore: document.getElementById('finalScore'),
    resultsList: document.getElementById('resultsList'),
    reviewButton: document.getElementById('reviewButton'),
    choice1: document.getElementById('choice1'),
    choice2: document.getElementById('choice2'),
    choice3: document.getElementById('choice3')
};

// Initialize quiz
function initQuiz() {
    loadQuestion();
    updateChoiceTexts();
    
    // Add event listener for review button
    elements.reviewButton.addEventListener('click', showReview);
}

// Load current question
function loadQuestion() {
    const q = questions[currentQuestion];
    elements.progress.textContent = `${currentQuestion + 1}/${questions.length}`;
    elements.question.textContent = q.question;
    elements.dimmedQuestion.textContent = q.question;
    
    // Reset UI state
    elements.questionScreen.style.display = 'block';
    elements.completionScreen.style.display = 'none';
    elements.resultScreen.style.display = 'none';
    showResult = false;
    selectedAnswer = null;
}

// Update choice button texts
function updateChoiceTexts() {
    const q = questions[currentQuestion];
    const choices = [elements.choice1, elements.choice2, elements.choice3];
    
    choices.forEach((choice, index) => {
        const textElement = choice.querySelector('.choice-text');
        textElement.textContent = q.choices[index];
        
        // Adjust font size based on text length
        if (q.choices[index].length > 8) {
            textElement.style.fontSize = '0.7rem';
        } else {
            textElement.style.fontSize = '0.9rem';
        }
    });
}

// Select answer
function selectAnswer(answerIndex) {
    if (showResult) return;
    
    selectedAnswer = answerIndex;
    const isCorrect = answerIndex === questions[currentQuestion].correct;
    
    const newAnswer = {
        questionIndex: currentQuestion,
        selectedAnswer: answerIndex,
        correct: isCorrect
    };
    
    userAnswers.push(newAnswer);
    
    if (isCorrect) {
        score++;
    }
    
    showAnswerResult(isCorrect);
}

// Show answer result
function showAnswerResult(isCorrect) {
    showResult = true;
    const q = questions[currentQuestion];
    
    // Update result mark
    elements.resultMark.textContent = isCorrect ? '○' : '×';
    elements.resultMark.className = isCorrect ? 'result-mark correct' : 'result-mark incorrect';
    
    // Update explanation content
    elements.answerLine.innerHTML = `<strong>【回答】</strong>${q.choices[selectedAnswer]}`;
    elements.correctLine.innerHTML = `<strong>【正解】</strong>${q.choices[q.correct]}`;
    elements.explanationText.textContent = q.explanation;
    
    // Show result screen
    elements.questionScreen.style.display = 'none';
    elements.resultScreen.style.display = 'block';
}

// Next question
function nextQuestion() {
    if (currentQuestion < questions.length - 1) {
        currentQuestion++;
        loadQuestion();
        updateChoiceTexts();
    } else {
        showCompletion();
    }
}

// Show completion screen (inside quiz box)
function showCompletion() {
    elements.questionScreen.style.display = 'none';
    elements.resultScreen.style.display = 'none';
    elements.completionScreen.style.display = 'flex';
}

// Show review (results page)
function showReview() {
    elements.resultsPage.style.display = 'block';
    
    // Update final score
    elements.finalScore.textContent = `${score}/${questions.length} 問正解`;
    
    // Generate results list
    generateResultsList();
}

// Generate results list
function generateResultsList() {
    let resultsHTML = '';
    
    questions.forEach((q, index) => {
        const userAnswer = userAnswers.find(ua => ua.questionIndex === index);
        const isCorrect = userAnswer?.correct || false;
        
        resultsHTML += `
            <div class="result-item ${isCorrect ? 'correct' : 'incorrect'}">
                <div class="result-question">問題${index + 1}: ${q.question}</div>
                <div class="result-user-answer">あなたの回答: ${q.choices[userAnswer?.selectedAnswer || 0]}</div>
                <div class="result-correct-answer">正解: ${q.choices[q.correct]}</div>
                <div class="result-status ${isCorrect ? 'correct' : 'incorrect'}">
                    ${isCorrect ? '○ 正解' : '× 不正解'}
                </div>
            </div>
        `;
    });
    
    elements.resultsList.innerHTML = resultsHTML;
}

// Return to start
function returnToStart() {
    currentQuestion = 0;
    selectedAnswer = null;
    showResult = false;
    userAnswers = [];
    score = 0;
    
    // Reset UI
    elements.completionScreen.style.display = 'none';
    elements.resultsPage.style.display = 'none';
    
    // Reload first question
    loadQuestion();
    updateChoiceTexts();
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initQuiz);