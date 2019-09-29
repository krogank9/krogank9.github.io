/* open a modal when a "read more" link is clicked in portfolio section */
$(".portfolio-read-more").click(function(e){
	let modalNum = $(e.target).attr("data-modal-num");
	let modal = $(".portfolio-modal-container.modal-"+modalNum);
	modal.css("display", "block").scrollTop(0);
	
	/* disable scrolling on body to allow scrolling of modal.
	 * iPhone body scrolling in modals is quite a pesky issue,
	 * decided to use a lib. this works 99% but still can scroll
	 * body if you zoom out quickly. good enough */
	bodyScrollLock.disableBodyScroll(modal[0]);
});

/* close (hide) all modals upon clicking a close button within one */
$(".portfolio-close-button, .portfolio-x-button").click(function() {
	$(".portfolio-modal-container").css("display", "none");
	
	/* re enable scrolling on body now that modal has disappeared */
	bodyScrollLock.clearAllBodyScrollLocks();
});
