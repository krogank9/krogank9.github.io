$("#save_dialog").dialog({
	autoOpen: false,
	modal: true,
	buttons: {
		"Save": function() {
			$( this ).dialog("close");
		},
		"Cancel": function() {
			$( this ).dialog("close");
		}
	},
	open: function() {
		update_selection();
	}
});
